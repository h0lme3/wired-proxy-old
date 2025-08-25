import { getSession } from "next-auth/react";
import Stripe from "stripe";
import cookie from "cookie";
import { prisma } from "../../helpers/database";
import { ApiError } from "../../helpers/errors";
import { evaluatePricing, getPricing } from "../../helpers/pricing";
import day from "dayjs";
import { CURRENT_SITE } from "../../helpers/sites";

const stripe = Stripe(process.env.STRIPE_SECRET);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
    return;
  }

  try {
    const { checkout } = req.body;

    if (!checkout) throw new ApiError("Bad request.");

    const session = await getSession({ req });
    const guest = !session?.user?.customerId;
    /// const userElite = !guest && session?.user?.meta === "elite"

    if (guest && (!checkout.email || !checkout.email.includes("@")))
      throw new ApiError(
        "Please sign-in or provide a valid email address to checkout."
      );

    const email = checkout.email
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9_\-@.+]/g, "");

    const existing = !checkout.main || checkout.orderId;

    // Start new code

    if (checkout.coupon) {
      const [customer, partner] = await Promise.all([
        prisma.customer.findUnique({
          where: { customerId: session.user.customerId },
          select: {
            partnerId: true,
            orders: { select: { orderId: true } },
          },
        }),
        prisma.partner.findFirst({
          where: { activeCoupon: { contains: checkout.coupon } },
        }),
      ]);

      if (
        customer &&
        partner &&
        customer.orders.length === 0 &&
        partner.partnerId !== customer.partnerId
      ) {
        await prisma.customer.update({
          where: { customerId: session.user.customerId },
          data: {
            partnerId: partner.partnerId,
            lastPartnerId: customer.partnerId,
          },
        });
      }
    } else {
      const cookies = cookie.parse(req.headers.cookie || "");
      const partnerCookie = cookies.partner_cookie;

      if (partnerCookie) {
        const [customer, partner] = await Promise.all([
          prisma.customer.findUnique({
            where: { customerId: session.user.customerId },
            select: {
              partnerId: true,
              orders: { select: { orderId: true } },
            },
          }),
          prisma.partner.findUnique({
            where: { cookies: partnerCookie },
          }),
        ]);

        if (
          customer &&
          partner &&
          customer.orders.length === 0 &&
          partner.partnerId !== customer.partnerId
        ) {
          await prisma.customer.update({
            where: { customerId: session.user.customerId },
            data: {
              partnerId: partner.partnerId,
              lastPartnerId: customer.partnerId,
            },
          });
        }
      }
    }

    // End new code

    const product = await prisma.product.findUnique({
      include: {
        productOrders: false,
        productPages: false,
      },
      where: {
        productName: checkout.productName,
      },
    });

    if (
      !product ||
      (!existing &&
        (!product.productActive ||
          !product.productStock)) /* || product.productSite !== CURRENT_SITE */
    )
      throw new ApiError("This product is currently out of stock");

    const { min: productMinQty } = evaluatePricing(product.productPricing);
    if (!existing && product.productStock < productMinQty)
      throw new ApiError("This product is currently out of stock");

    if (
      !existing &&
      product.productStock > 200 &&
      product.productStock < checkout.quantity
    )
      throw new ApiError(
        `The stock for this product is currently low for this quantity, please choose a lower quantity.`
      );

    if (
      !existing &&
      product.productStock <= 200 &&
      product.productStock < checkout.quantity
    )
      throw new ApiError(
        `The stock for this product is currently low, you can order up to ${product.productStock} quantity.`
      );

    const pricing = evaluatePricing(product.productPricing);

    let price = getPricing(pricing, checkout.quantity, checkout.period);
    if (!price || isNaN(price))
      throw new ApiError(
        "Please choose the appropriate type & quantity for this order."
      );

    let user;

    if (guest && !existing) {
      const exists = await prisma.customer.count({
        where: {
          email,
          site: CURRENT_SITE,
        },
      });

      if (exists)
        throw new ApiError(
          "This email address already exists, please sign-in before placing the order!"
        );
    } else {
      const exists = await prisma.customer.findUnique({
        where: {
          customerId: session.user.customerId,
        },
      });

      if (!exists)
        throw new ApiError(
          "Couldn't find your account, please sign-in before placing the order!"
        );

      user = exists;
    }

    const order =
      checkout.orderId &&
      (await prisma.order.findUnique({
        where: {
          orderId: checkout.orderId,
        },
        select: {
          expiry: true,
          ecomOrderId: true,
          productName: true,
          total: true,
          length: true,
          status: true,
          customerId: true,
          coupon: {
            select: {
              oneTime: true,
            },
          },
        },
      }));

    if (checkout.orderId && !order)
      throw new ApiError(`Couldn't find this order ID.`);

    if (order && user && order.customerId !== user.customerId)
      throw new ApiError(`This order is not assigned to your account.`);

    const subscription = product.productRecurring && checkout.subscription;
    if (subscription && order?.ecomOrderId)
      throw new ApiError(
        "This order already has an active subscription attached, please refresh the page or try again later."
      );

    if (subscription && product.productPreorder && !existing)
      throw new ApiError("Can't preorder a product with auto-renew on.");

    const inheritOrderData =
      subscription &&
      checkout.orderId &&
      checkout.period == order?.length?.replace("D", "") &&
      order?.total != 0 &&
      !order?.coupon?.oneTime;

    let discount = 0;
    let discountCoupon;
    if (checkout.coupon) {
      if (inheritOrderData)
        throw new ApiError(`Coupons are not applicable to this order.`);

      await prisma.$transaction(async (tx) => {
        const coupon = await prisma.promotion.findUnique({
          where: {
            discountCode: checkout.coupon,
          },
        });

        if (
          !coupon ||
          !coupon.active ||
          coupon.use >= coupon.maxUses ||
          coupon.site !== CURRENT_SITE
        )
          throw new ApiError(`This coupon is not valid`);

        const couponProducts = coupon.appliesTo?.split(",");
        if (!couponProducts?.includes(checkout.productName))
          throw new ApiError(`This coupon can't be applied to this product`);

        if (
          coupon.minimumQuantity &&
          checkout.quantity < coupon.minimumQuantity
        )
          throw new ApiError(`Can't use this coupon with the chosen quantity.`);

        if (
          coupon.maximumQuantity &&
          checkout.quantity > coupon.maximumQuantity
        )
          throw new ApiError(
            `Can't apply this coupon with the chosen quantity. Maximum quantity is: ${coupon.maximumQuantity}`
          );

        if (coupon.oneTime && !coupon.oneTimeCoupon && subscription) {
          const stripeCoupon = await stripe.coupons.create({
            percent_off: coupon.discount,
            name: coupon.discountCode,
          });

          await tx.promotion.update({
            where: {
              discountCode: checkout.coupon,
            },
            data: {
              oneTimeCoupon: stripeCoupon.id,
            },
          });

          discountCoupon = stripeCoupon.id;
        } else if (coupon.oneTime && coupon.oneTimeCoupon && subscription) {
          discountCoupon = coupon.oneTimeCoupon;
        } else {
          discount += price * (coupon.discount / 100);
        }

        return true;
      });
    }
    /*
                if (userElite && product.productEliteDiscount)
                    discount += price * (product.productEliteDiscount / 100)
        */
    if (discount) price = price - discount;

    if (!price || isNaN(price) || price <= 0)
      throw new ApiError(
        "Please choose the appropriate type & quantity for this order."
      );

    if (order && !product.productExtendable)
      throw new ApiError(`Can't extend, renew or subscribe to this order.`);

    if (order && order.status !== "ACTIVE")
      throw new ApiError(
        `This order is still pending, please try again later.`
      );

    if (checkout?.productPage) {
      const page = await prisma.productPage.findUnique({
        where: {
          productPageId: checkout.productPage,
        },
        select: {
          productName: true,
        },
      });

      if (!page || page.productName !== product.productName) {
        throw new ApiError(
          `Page product mismatch with the cart product, please reload the page or try again later. If the problem presists please notify an administrator.`
        );
      }
    }

    let ref = null;
    if (checkout.ref && !isNaN(Number(checkout.ref))) {
      const exists = await prisma.webhook.findFirst({
        where: {
          webhookId: Number(checkout.ref),
        },
        select: {
          webhookId: true,
        },
      });

      if (exists) ref = exists.webhookId;
    }

    const sessionPayload = {
      metadata: {
        source: "NEXT_WIRED_DASHBOARD",
        orderId: checkout?.orderId ?? undefined,
        productName: product.productName,
        quantity: checkout.quantity,
      },

      cancel_url: process.env.NEXTAUTH_URL + "/?error",
      success_url: process.env.NEXTAUTH_URL + "/?success",

      mode: subscription ? "subscription" : "payment",
      client_reference_id:
        checkout.vip && checkout.referral
          ? checkout.referral
          : user?.customerId ?? undefined,

      customer: user?.stripeId ? user?.stripeId : undefined,
      customer_email: user?.stripeId ? undefined : email,
      billing_address_collection: "required",

      customer_creation: user?.stripeId || subscription ? undefined : "always",

      line_items: [
        {
          price_data: {
            currency: "USD",
            unit_amount_decimal: inheritOrderData
              ? Math.round(order.total * 100)
              : Math.round(price * 100),
            product_data: {
              name: product.productTitle,
              description: `${checkout.quantity} quantity with ${checkout.period} day(s) length`,
              images: [process.env.NEXT_PUBLIC_DOMAIN + "product-logo.png"],
            },
            recurring: !subscription
              ? undefined
              : {
                  interval: "day",
                  interval_count: checkout.period,
                },
          },
          quantity: 1,
        },
      ],
    };

    const dispatchTime = checkout.period == 1 && checkout.dispatchTime;
    if (dispatchTime) {
      const diffDispatch = +new Date(dispatchTime) - +new Date();
      if (isNaN(diffDispatch))
        throw new ApiError(
          `Dispatch time is invalid, please choose a valid dispatch time.`
        );

      if (diffDispatch > 7 * 24 * 3600 * 1000)
        throw new ApiError(
          `Dispatch time can't be more than a week in advance.`
        );
    }

    const metadata = {
      source: "NEXT_WIRED_DASHBOARD",
      orderId: checkout?.orderId ?? undefined,
      customerId: user?.customerId ?? undefined,
      productPage: checkout?.productPage ?? undefined,
      productName: product.productName,
      dispatchTime: dispatchTime || undefined,
      main: checkout.main,
      coupon: checkout.coupon,
      quantity: checkout.quantity,
      period: checkout.period,
      daily: checkout.daily,
      subscription,
      guest,
      ref,
    };

    if (subscription) {
      const trial_end =
        existing && order?.expiry ? order.expiry / 1000 - 60 * 60 : undefined;
      const days = day(trial_end * 1000).diff(+new Date(), "days");

      sessionPayload.subscription_data = {
        trial_end: days > 2 ? trial_end : undefined,
        metadata: {
          ...metadata,
          rewardful: checkout.vip ? undefined : false,
        },
      };
    } else {
      sessionPayload.payment_intent_data = {
        capture_method: "automatic",
        metadata: {
          ...metadata,
          rewardful: checkout.vip ? undefined : false,
        },
      };
    }

    if (discountCoupon) sessionPayload.discounts = [{ coupon: discountCoupon }];

    /*
        await prisma.$transaction(async tx => {

            const product = await tx.product.findUnique({
                include: {
                    productOrders: false,
                    productPages: false,
                },
                where: {
                    productName: checkout.productName
                }
            })
    
            if (!product || (!existing && (!product.productActive || !product.productStock)) || product.productSite !== CURRENT_SITE)
                throw new ApiError("This product is currently out of stock")

            if (metadata.orderId) 
                return
            
            return await tx.product.update({
                where: {
                    productName: metadata.productName
                },
                data: {
                    productStock: {
                        decrement: Number(metadata.quantity)
                    }
                }
            })
        })
        */

    const stripeSession = await stripe.checkout.sessions.create(sessionPayload);
    if (!stripeSession)
      throw new ApiError(
        "Couldn't create stripe session, please try again later"
      );

    /*
        try {
            await prisma.checkoutSession.create({
                data: {
                    id: stripeSession.id,
                    createdAt: new Date(),
                    status: "active"
                }
            })
        } catch (error) {
            console.error(`Error happened while saving checkout sesion ${stripeSession.id} : ${error}`)
        } */

    res
      .status(200)
      .send({ ok: true, id: stripeSession.id, url: stripeSession.url });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(400).send({ ok: false, message: error.message });
    } else {
      console.error(error);
      return res.status(500).send({
        ok: false,
        message: "Couldn't process your request at this time.",
      });
    }
  }
}
