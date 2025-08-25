export function Features({ }) {
    return (
        <section className="our-features-section">
            <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <div className="main-title-wrapper">
                            <h5 className="main-pre-title-text">Features</h5>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-4">
                        <div className="our-features-box-wrapper">
                            <div className="our-features-box-wrap">
                                <div className="our-features-box-head">
                                    <div className="our-features-box-icon">
                                        <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/our-features-icon.png`} alt="" className="our-features-box-icon-image" />
                                    </div>
                                    <div className="our-features-box-title">
                                        <h3 className="our-features-box-title-text">Superior Dashboard</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="our-features-box-wrapper">
                            <div className="our-features-box-wrap">
                                <div className="our-features-box-head">
                                    <div className="our-features-box-icon">
                                        <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/our-features-icon.png`} alt="" className="our-features-box-icon-image" />
                                    </div>
                                    <div className="our-features-box-title">
                                        <h3 className="our-features-box-title-text">Instant Delivery</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="our-features-box-wrapper">
                            <div className="our-features-box-wrap">
                                <div className="our-features-box-head">
                                    <div className="our-features-box-icon">
                                        <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/our-features-icon.png`} alt="" className="our-features-box-icon-image" />
                                    </div>
                                    <div className="our-features-box-title">
                                        <h3 className="our-features-box-title-text">24/7 Support</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row justify-content-center">
                    <div className="col-md-4 ">
                        <div className="our-features-box-wrapper">
                            <div className="our-features-box-wrap">
                                <div className="our-features-box-head">
                                    <div className="our-features-box-icon">
                                        <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/our-features-icon.png`} alt="" className="our-features-box-icon-image" />
                                    </div>
                                    <div className="our-features-box-title">
                                        <h3 className="our-features-box-title-text">Bulk Availability</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="our-features-box-wrapper">
                            <div className="our-features-box-wrap">
                                <div className="our-features-box-head">
                                    <div className="our-features-box-icon">
                                        <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/our-features-icon.png`} alt="" className="our-features-box-icon-image" />
                                    </div>
                                    <div className="our-features-box-title">
                                        <h3 className="our-features-box-title-text">Crypto Accepted</h3>
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
