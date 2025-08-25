export function CustomerSupport({ }) {
    return (
        <section className="customer-suppert-cta-section">
            <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <div className="customer-suppert-cta-wrapper">
                            <div className="row">
                                <div className="col-md-7">
                                    <div className="customer-suppert-cta-title-wrap">
                                        <h4 className="customer-suppert-cta-title">
                                            Get in touch for updates & customer support.
                                        </h4>
                                    </div>
                                </div>
                                <div className="col-md-5">
                                    <div className="customer-suppert-cta-links-wrap">
                                        <ul className="customer-suppert-cta-links">
                                            <li>
                                                <a href="mailto:help@wiredproxies.com">
                                                    <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/email-icon.png`} alt="Email" />
                                                </a>
                                            </li>
                                            <li>
                                                <a href="https://discord.gg/WDmy7EmRZu" rel="noreferrer" target="_blank">
                                                    <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/discord-logo.png`} alt="Twitter" />
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
