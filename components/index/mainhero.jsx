export function MainHero ({ }) {
    return (
        <section className="main-hero-section">
            <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <div className="main-hero-content-wrapper">
                            <div className="main-hero-content-wrap">
                                <h1 className="main-hero-content-title">Keeping you wired into the industry.</h1>
                                <h2 className="main-hero-content-subtitle">Wired is a purpose built proxy solution for exclusive releases.</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="main-hero-image-wrapper">
                            <div className="main-hero-image-wrap">
                                <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/main-hero-image.png`} alt="" className="heroImageAnimation" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="main-hero-section-line-bg"></div>
        </section>
    )
}
