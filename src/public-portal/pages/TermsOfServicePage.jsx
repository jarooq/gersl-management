import React from 'react';
import { FileText, AlertCircle, Scale, Mail, Phone } from 'lucide-react';

const TermsOfServicePage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Scale className="mx-auto mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-blue-100">
              Last Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">

            {/* Introduction */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Global Ehsan Relief - Sri Lanka ("we," "us" or "our"), concerning your access to and use of our website and services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You agree that by accessing the website, you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these terms, then you are expressly prohibited from using the site and you must discontinue use immediately.
              </p>
            </div>

            {/* Intellectual Property */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-blue-600" size={32} />
                <h2 className="text-3xl font-bold text-gray-900">Intellectual Property Rights</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                Unless otherwise indicated, the website is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the website (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                The Content and the Marks are provided on the website "AS IS" for your information and personal use only. Except as expressly provided in these Terms of Service, no part of the website and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.
              </p>
            </div>

            {/* User Representations */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">User Representations</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using the website, you represent and warrant that:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>All registration information you submit will be true, accurate, current, and complete</li>
                <li>You will maintain the accuracy of such information and promptly update such registration information as necessary</li>
                <li>You have the legal capacity and you agree to comply with these Terms of Service</li>
                <li>You are not a minor in the jurisdiction in which you reside</li>
                <li>You will not access the website through automated or non-human means</li>
                <li>You will not use the website for any illegal or unauthorized purpose</li>
                <li>Your use of the website will not violate any applicable law or regulation</li>
              </ul>
            </div>

            {/* Prohibited Activities */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-red-600" size={32} />
                <h2 className="text-3xl font-bold text-gray-900">Prohibited Activities</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                You may not access or use the website for any purpose other than that for which we make the website available. The website may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                As a user of the website, you agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Systematically retrieve data or other content from the website to create or compile a collection</li>
                <li>Make any unauthorized use of the website, including collecting usernames and/or email addresses</li>
                <li>Use the website to advertise or offer to sell goods and services</li>
                <li>Circumvent, disable, or otherwise interfere with security-related features of the website</li>
                <li>Engage in unauthorized framing of or linking to the website</li>
                <li>Trick, defraud, or mislead us and other users</li>
                <li>Make improper use of our support services or submit false reports of abuse or misconduct</li>
                <li>Interfere with, disrupt, or create an undue burden on the website or the networks or services connected to the website</li>
                <li>Harass, annoy, intimidate, or threaten any of our employees or agents</li>
                <li>Upload or transmit viruses, Trojan horses, or other material that interferes with any party's uninterrupted use of the website</li>
                <li>Use any information obtained from the website in order to harass, abuse, or harm another person</li>
                <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the website</li>
              </ul>
            </div>

            {/* Donations */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Donations and Payments</h2>

              <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">Donation Policy</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All donations made through our website are voluntary and non-refundable except as required by law. We reserve the right to use donations for programs and purposes that best serve our mission and the communities we serve.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">Tax Receipts</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Tax-deductible receipts will be issued for donations as permitted under Sri Lankan tax law. It is your responsibility to determine the tax deductibility of your donation.
              </p>

              <h3 className="text-xl font-bold text-gray-800 mb-3 mt-6">Payment Processing</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use secure third-party payment processors to handle donation transactions. By making a donation, you agree to the terms and conditions of our payment processors.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                THE WEBSITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE WEBSITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE WEBSITE AND YOUR USE THEREOF.
              </p>
              <p className="text-gray-700 leading-relaxed">
                WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE WEBSITE'S CONTENT OR THE CONTENT OF ANY WEBSITES LINKED TO THE WEBSITE AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE WEBSITE.
              </p>
            </div>

            {/* Indemnification */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of your use of the website, breach of these Terms of Service, or violation of the rights of a third party.
              </p>
            </div>

            {/* Governing Law */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service and your use of the website are governed by and construed in accordance with the laws of Sri Lanka applicable to agreements made and to be entirely performed within Sri Lanka, without regard to its conflict of law principles.
              </p>
            </div>

            {/* Modifications */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Modifications and Interruptions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to change, modify, or remove the contents of the website at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our website.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We cannot guarantee the website will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the website, resulting in interruptions, delays, or errors.
              </p>
            </div>

            {/* Termination */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service shall remain in full force and effect while you use the website. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE WEBSITE TO ANY PERSON FOR ANY REASON OR FOR NO REASON.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold text-gray-900">Global Ehsan Relief - Sri Lanka</p>
                <p>65 Abdul Majeed Road, Kinniya-04, Trincomalee, Sri Lanka</p>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-blue-600" />
                  <span>+94 26 223 6220 / +94 77 703 0822</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-blue-600" />
                  <a href="mailto:info@global-ehsan-relief.org.lk" className="text-blue-600 hover:text-blue-700">
                    info@global-ehsan-relief.org.lk
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfServicePage;
