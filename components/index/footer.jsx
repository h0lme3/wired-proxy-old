export function Footer({ }) {
    return (
        <footer className="site-footer">
            <div className="site-footer-line-bg">
            </div>
            <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <div className="site-footer-logo-wrapper">
                            <a href="#">
                                <img src={`${process.env.NEXT_PUBLIC_DOMAIN}website/images/porter-color-white-logo.png`} alt="Wired Proxies" />
                            </a>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="site-footer-copyright-text">
                            <p>Copyright © 2023 Wired Proxies</p>
                            <p style={{fontSize: '13px'}} onClick={e => e.stopPropagation()}><a target="_blank" href='/legal/terms-conditions.html' style={{ textDecoration: "underline" }}>Terms &#38; Conditions</a> - <a target="_blank" href='/legal/privacy-policy.html' style={{ textDecoration: "underline" }}>Privacy Policy</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
