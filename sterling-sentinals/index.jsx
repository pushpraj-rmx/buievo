import React, { useState, useEffect, useRef } from 'react';

// STYLES - Kept in a JS object for clarity within the React component structure
const styles = {
    body: "bg-[#121212] text-[#EAEAEA] font-['Inter',_sans-serif] antialiased scroll-smooth",
    goldAccent: "text-[#B89B72]",
    goldBorder: "border-[#B89B72]",
    grayBorder: "border-[#333333]",
    goldBg: "bg-[#B89B72]",
    charcoalBg: "bg-[#121212]",
    navLink: "text-sm uppercase tracking-widest relative after:content-[''] after:block after:w-0 after:h-[1px] after:bg-[#B89B72] after:transition-all after:duration-300 hover:after:w-full",
    section: "py-20 md:py-32",
    container: "container mx-auto px-6",
    h1: "text-4xl md:text-6xl font-bold leading-tight font-['Playfair_Display',_serif]",
    h2: "text-3xl font-bold font-['Playfair_Display',_serif]",
    h3: "text-xl font-bold",
    p: "text-lg text-[#EAEAEA]/80",
    fadeInSection: "transition-opacity duration-700 ease-out transform translate-y-5 opacity-0",
    visibleSection: "opacity-100 translate-y-0",
};

// --- Reusable Components ---

const FadeInSection = ({ children }) => {
    const domRef = useRef();
    const [isVisible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setVisible(true);
                observer.unobserve(domRef.current);
            }
        });
        observer.observe(domRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={domRef} className={`${styles.fadeInSection} ${isVisible ? styles.visibleSection : ''}`}>
            {children}
        </div>
    );
};


// --- Page Section Components ---

const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-opacity-80 backdrop-blur-sm bg-[#121212]">
        <div className={`${styles.container} py-4 flex justify-between items-center`}>
            <a href="#hero" className="text-xl font-bold tracking-wider font-['Playfair_Display',_serif]">Sterling Sentinel</a>
            <nav className="hidden md:flex space-x-8">
                <a href="#engagements" className={styles.navLink}>Engagements</a>
                <a href="#difference" className={styles.navLink}>Difference</a>
                <a href="#method" className={styles.navLink}>Method</a>
                <a href="#contact" className={styles.navLink}>Contact</a>
            </nav>
        </div>
    </header>
);

const Hero = () => (
    <section id="hero" className="h-screen flex items-center justify-center text-center">
        <FadeInSection>
            <div className="max-w-4xl mx-auto px-6">
                <h1 className={styles.h1}>In a connected world, your greatest asset is your privacy.</h1>
                <p className="mt-6 text-lg md:text-xl text-[#EAEAEA]/80">Sterling Sentinel provides discreet, bespoke cybersecurity partnerships for prominent individuals and families. We protect your privacy, your assets, and your peace of mind.</p>
            </div>
        </FadeInSection>
    </section>
);

const Mandate = () => (
    <section id="mandate" className={styles.section}>
        <div className={styles.container}>
            <div className="grid md:grid-cols-5 gap-12 items-center">
                <div className="md:col-span-2">
                    <FadeInSection>
                        <h2 className={`${styles.h2} ${styles.goldAccent}`}>Our Mandate</h2>
                        <p className={`mt-4 ${styles.p}`}>Our mandate is simple: to act as the single, trusted guardian of your personal digital world. We operate with the discretion of a private counsel and the precision of a security specialist, ensuring technology serves you, not exposes you.</p>
                    </FadeInSection>
                </div>
                <div className="md:col-span-3">
                    <FadeInSection>
                        <div className={`border-l-2 ${styles.goldBorder} pl-8`}>
                            <h3 className="text-2xl font-bold font-['Playfair_Display',_serif]">The Modern Vulnerability</h3>
                            <p className="mt-4 text-[#EAEAEA]/80">You have forged a formidable chain of security around your life, with corporate-grade protection for your business and physical security for your home. But this chain has a vulnerability.</p>
                            <blockquote className="mt-4 italic text-[#EAEAEA]/70">The 18th-century philosopher Thomas Reid observed that "a chain is only as strong as its weakest link." Today, that weak link is your personal digital life. It is the often-overlooked area that has become the primary target for sophisticated threats—a gap attackers exploit by targeting your family, personal devices, and public profile, leaving your entire structure exposed.</blockquote>
                        </div>
                    </FadeInSection>
                </div>
            </div>
        </div>
    </section>
);

const Engagements = () => {
    const [activeService, setActiveService] = useState('audit');

    const ServiceContent = ({ id, title, description, items, isVisible }) => (
        <div className={`transition-opacity duration-500 ease-in-out ${isVisible ? 'block' : 'hidden'}`}>
             <div className={`border ${styles.grayBorder} rounded-lg p-8`}>
                <h3 className={`text-2xl font-bold ${styles.goldAccent} font-['Playfair_Display',_serif]`}>{title}</h3>
                <p className="mt-2 text-[#EAEAEA]/80">{description}</p>
                <ul className="mt-6 space-y-4">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-start">
                            <span className={`${styles.goldAccent} mr-3 mt-1`}>◆</span>
                            <span><strong>{item.title}</strong> {item.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
    
    const auditItems = [
        { title: "Fortifying Your Sanctum:", text: "On-site audit and reinforcement of your home, yacht, and personal office networks." },
        { title: "Hardening Your Devices:", text: "Securing the personal technology used by you and your immediate family." },
        { title: "Erasing Your Digital Shadow:", text: "Reducing your public data footprint to mitigate the risk of social engineering and identity theft." },
        { title: "Your Confidential Security Briefing:", text: "A clear, strategic report and roadmap for enduring protection." }
    ];

    const retainerItems = [
        { title: "Proactive Threat Intelligence:", text: "Continuous monitoring for emerging threats and data breaches that could impact your family or assets." },
        { title: "Direct Principal Access:", text: "Immediate, on-call access to your dedicated security principal for any questions or concerns." },
        { title: "Quarterly Strategy Reviews:", text: "Regular adjustments to your security posture to adapt to new technologies and evolving risks." },
        { title: "A Unified Shield:", text: "We work seamlessly alongside your existing team—your wealth manager, legal counsel, and physical security—to ensure complete protection." }
    ];

    return (
        <section id="engagements" className={`${styles.section} ${styles.charcoalBg}`}>
            <div className={`${styles.container} text-center`}>
                <FadeInSection>
                    <h2 className={styles.h2}>Our Engagements</h2>
                    <p className="mt-4 max-w-3xl mx-auto text-[#EAEAEA]/80">Our partnerships are structured to provide comprehensive, end-to-end security through a clear, two-tiered partnership model.</p>
                    
                    <div className={`mt-12 max-w-md mx-auto border-2 ${styles.grayBorder} rounded-full p-1 flex`}>
                        <button onClick={() => setActiveService('audit')} className={`w-1/2 py-2 rounded-full font-semibold transition-colors duration-300 ${activeService === 'audit' ? `${styles.goldBg} text-[#121212]` : ''}`}>Sentinel Audit</button>
                        <button onClick={() => setActiveService('retainer')} className={`w-1/2 py-2 rounded-full font-semibold transition-colors duration-300 ${activeService === 'retainer' ? `${styles.goldBg} text-[#121212]` : ''}`}>Guardian Retainer</button>
                    </div>

                    <div className="mt-8 text-left max-w-4xl mx-auto">
                        <ServiceContent id="auditContent" title="1. The Sentinel Audit (Foundation)" description="A comprehensive, one-time assessment and fortification of your entire personal digital ecosystem." items={auditItems} isVisible={activeService === 'audit'} />
                        <ServiceContent id="retainerContent" title="2. The Guardian Retainer (Partnership)" description="An ongoing subscription for continuous, proactive protection and on-call support." items={retainerItems} isVisible={activeService === 'retainer'} />
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

const Difference = () => (
    <section id="difference" className={styles.section}>
        <div className={`${styles.container} text-center`}>
            <FadeInSection>
                <h2 className={styles.h2}>The Sterling Sentinel Difference</h2>
                <div className="mt-16 grid md:grid-cols-3 gap-12 text-left">
                    <div className={`border-t-2 ${styles.goldBorder} pt-6`}>
                        <h3 className={styles.h3}>A Singular Focus</h3>
                        <p className="mt-2 text-[#EAEAEA]/80">Corporate solutions protect your business. We protect *you*. Our entire practice is dedicated to the unique security challenges of your personal life.</p>
                    </div>
                    <div className={`border-t-2 ${styles.goldBorder} pt-6`}>
                        <h3 className={styles.h3}>A Personal Principal</h3>
                        <p className="mt-2 text-[#EAEAEA]/80">Your security is never delegated. You have a direct, one-to-one relationship with a dedicated principal who understands your world.</p>
                    </div>
                    <div className={`border-t-2 ${styles.goldBorder} pt-6`}>
                        <h3 className={styles.h3}>A Seamless Integration</h3>
                        <p className="mt-2 text-[#EAEAEA]/80">We are the vital link that connects your existing teams, creating a unified and impenetrable layer of security around you.</p>
                    </div>
                </div>
            </FadeInSection>
        </div>
    </section>
);

const Method = () => {
    const steps = [
        { num: '01', title: 'Discovery & Discretion', text: 'A confidential meeting to understand your unique context and concerns.' },
        { num: '02', title: 'Assessment & Analysis', text: 'The on-site and digital execution of the Sentinel Audit.' },
        { num: '03', title: 'Fortification & Implementation', text: 'The collaborative rollout of your bespoke security strategy.' },
        { num: '04', title: 'Vigilance & Partnership', text: 'The seamless transition to our ongoing Guardian Retainer.' }
    ];

    return (
        <section id="method" className={`${styles.section} ${styles.charcoalBg}`}>
            <div className={`${styles.container} text-center`}>
                <FadeInSection>
                    <h2 className={styles.h2}>Our Method</h2>
                    <p className="mt-4 max-w-3xl mx-auto text-[#EAEAEA]/80">Our engagement process is built on discretion, clarity, and effectiveness.</p>
                    <div className="mt-16 grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
                        {steps.map(step => (
                            <div key={step.num} className={`border-b-2 ${styles.grayBorder} p-6 text-left transition-colors duration-300 hover:${styles.goldBorder} group`}>
                                <div className={`text-3xl font-bold ${styles.goldAccent}`}>{step.num}</div>
                                <h3 className="mt-4 font-bold group-hover:text-[#B89B72] transition-colors duration-300">{step.title}</h3>
                                <p className="mt-2 text-sm text-[#EAEAEA]/70">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

const Contact = () => (
    <section id="contact" className={styles.section}>
        <div className={`${styles.container} text-center`}>
            <FadeInSection>
                <h2 className={styles.h2}>Initiate Contact</h2>
                <p className="mt-4 max-w-2xl mx-auto text-[#EAEAEA]/80">Access to our services is typically granted through referral from a trusted advisor. For a direct, confidential inquiry, you may use the secure channel below.</p>
                <div className="mt-12 max-w-xl mx-auto">
                    <form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input type="text" placeholder="Full Name" className={`w-full p-3 rounded-md ${styles.charcoalBg} border ${styles.grayBorder} focus:${styles.goldBorder} focus:outline-none`} />
                            <input type="email" placeholder="Email Address" className={`w-full p-3 rounded-md ${styles.charcoalBg} border ${styles.grayBorder} focus:${styles.goldBorder} focus:outline-none`} />
                        </div>
                        <textarea placeholder="Brief, non-confidential message..." rows="4" className={`w-full mt-6 p-3 rounded-md ${styles.charcoalBg} border ${styles.grayBorder} focus:${styles.goldBorder} focus:outline-none`}></textarea>
                        <button type="submit" className={`mt-6 px-12 py-3 rounded-md ${styles.goldBg} text-[#121212] font-bold hover:opacity-90 transition-opacity`}>Submit Secure Inquiry</button>
                    </form>
                </div>
            </FadeInSection>
        </div>
    </section>
);

const Footer = () => (
    <footer className={`py-8 border-t ${styles.grayBorder}`}>
        <div className={`${styles.container} text-center text-sm text-[#EAEAEA]/60`}>
            <p>&copy; 2025 Sterling Sentinel. All Rights Reserved.</p>
            <p className="mt-2">Discreet Digital Protection for Private Clients.</p>
        </div>
    </footer>
);


// --- Main App Component ---

export default function App() {
  return (
    <div className={styles.body}>
      <Header />
      <main>
        <Hero />
        <Mandate />
        <Engagements />
        <Difference />
        <Method />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

