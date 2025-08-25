import { serialize } from "cookie";

export const getServerSideProps = async (context) => {
  const cookieCode = context.query.cookie;

  if (cookieCode) {
    context.res.setHeader(
      "Set-Cookie",
      serialize("partner_cookie", cookieCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
    );
  }

  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
};

export default function CodePage() {
  return null;
}
