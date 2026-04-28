import React, { useState } from 'react';
import {
  Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle,
  Facebook, Twitter, Instagram, Linkedin, Globe, Users,
  Building2, Heart, MessageSquare, User, FileText
} from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'General Inquiry'
  });

  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulate form submission
    setTimeout(() => {
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: 'General Inquiry'
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 1000);
  };

  const inquiryTypes = [
    'General Inquiry',
    'Partnership Opportunities',
    'Donation Information',
    'Volunteer Registration',
    'Career Opportunities',
    'Media & Press',
    'Support & Assistance',
    'Other'
  ];

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone Numbers',
      details: [
        '+94 26 223 6220',
        '+94 77 703 0822'
      ],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      link: 'tel:+94262236220'
    },
    {
      icon: Mail,
      title: 'Email Address',
      details: [
        'info@global-ehsan-relief.org.lk'
      ],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      link: 'mailto:info@global-ehsan-relief.org.lk'
    },
    {
      icon: MapPin,
      title: 'Head Office',
      details: [
        '65 Abdul Majeed Road, Kinniya-04',
        'Trincomalee, Sri Lanka'
      ],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      link: 'https://maps.google.com/?q=Kinniya,Trincomalee,Sri+Lanka'
    },
    {
      icon: Clock,
      title: 'Office Hours',
      details: [
        'Monday - Friday: 8:00 AM - 5:00 PM',
        'Saturday: 8:00 AM - 12:00 PM'
      ],
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const socialMedia = [
    { icon: Facebook, name: 'Facebook', url: '#', color: 'hover:text-blue-600' },
    { icon: Twitter, name: 'Twitter', url: '#', color: 'hover:text-sky-500' },
    { icon: Instagram, name: 'Instagram', url: '#', color: 'hover:text-pink-600' },
    { icon: Linkedin, name: 'LinkedIn', url: '#', color: 'hover:text-blue-700' }
  ];

  const departments = [
    {
      name: 'Orphan Care',
      icon: Heart,
      email: 'orphancare@global-ehsan-relief.org.lk',
      phone: '+94 77 703 0822'
    },
    {
      name: 'Partnerships',
      icon: Users,
      email: 'partnerships@global-ehsan-relief.org.lk',
      phone: '+94 26 223 6220'
    },
    {
      name: 'Finance',
      icon: Building2,
      email: 'finance@global-ehsan-relief.org.lk',
      phone: '+94 26 223 6220'
    },
    {
      name: 'Human Resources',
      icon: Users,
      email: 'hr@global-ehsan-relief.org.lk',
      phone: '+94 77 703 0822'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300 rounded-full -ml-32 -mb-32 animate-pulse delay-75"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full mb-6 border border-white/30">
              <MessageSquare size={20} />
              <span className="font-semibold">We'd Love to Hear From You</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Get in Touch
            </h1>

            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto">
              Have questions, ideas, or want to support our mission? Reach out to us and our team will get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-16 -mt-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className={`${info.bgColor} rounded-2xl p-8 border-2 border-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 group`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg`}>
                  <info.icon className="text-white" size={28} />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-4">{info.title}</h3>

                <div className="space-y-2">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-700 font-medium">
                      {detail}
                    </p>
                  ))}
                </div>

                {info.link && (
                  <a
                    href={info.link}
                    target={info.link.startsWith('http') ? '_blank' : undefined}
                    rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-block mt-4 text-blue-600 font-semibold hover:underline"
                  >
                    {info.icon === Phone ? 'Call Now' : info.icon === Mail ? 'Send Email' : 'View on Map'}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Contact Form */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-gray-100">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Send Us a Message</h2>
                <p className="text-gray-600">Fill out the form below and we'll get back to you within 24 hours.</p>
              </div>

              {submitStatus === 'success' && (
                <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-green-800 mb-1">Message Sent Successfully!</h4>
                    <p className="text-sm text-green-700">Thank you for contacting us. We'll respond to your inquiry soon.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Inquiry Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Inquiry Type *
                  </label>
                  <select
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    {inquiryTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="+94 XX XXX XXXX"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Brief subject of your message"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                    placeholder="Tell us more about your inquiry..."
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Send Message
                </button>
              </form>
            </div>

            {/* Additional Information */}
            <div className="space-y-8">
              {/* Map */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
                <div className="h-80 bg-gradient-to-br from-blue-100 to-purple-100 relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31583.91651095891!2d81.17899461896742!3d8.489444740611908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3afbc9a5f5c5c5c5%3A0x5c5c5c5c5c5c5c5c!2sKinniya%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="GERSL Location - Kinniya, Trincomalee"
                  ></iframe>
                </div>
              </div>

              {/* Department Contacts */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Department Contacts</h3>
                <div className="space-y-4">
                  {departments.map((dept, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-4 hover:bg-blue-50 transition-all group border border-gray-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <dept.icon className="text-white" size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">{dept.name}</h4>
                          <p className="text-sm text-gray-600 mb-1">
                            <Mail size={14} className="inline mr-2" />
                            {dept.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Phone size={14} className="inline mr-2" />
                            {dept.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Connect With Us</h3>
                <p className="text-gray-600 mb-6">Follow us on social media to stay updated with our latest projects and impact stories.</p>
                <div className="flex gap-4">
                  {socialMedia.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center ${social.color} transition-all hover:scale-110 hover:shadow-lg`}
                    >
                      <social.icon size={24} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-lg">Find quick answers to common questions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[
              {
                question: 'How can I support your programs?',
                answer: 'You can support us through donations, volunteering, or partnering with us. Visit our campaigns page to learn more.'
              },
              {
                question: 'Are donations tax-deductible?',
                answer: 'Yes, GERSL is a registered charity and all donations are tax-deductible. We provide receipts for all contributions.'
              },
              {
                question: 'How do I apply for assistance?',
                answer: 'Contact our relevant department or visit our office during business hours. Our team will guide you through the application process.'
              },
              {
                question: 'Can I volunteer with GERSL?',
                answer: 'Absolutely! We welcome volunteers. Please fill out the contact form selecting "Volunteer Registration" to get started.'
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-all"
              >
                <h4 className="font-bold text-gray-800 mb-3 text-lg">{faq.question}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
