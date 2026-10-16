import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const CONTACT = {
  phone: "+91 98765 43210",
  email: "support@vrajcreation.com",
  address: "Jodhpur, Rajasthan, India",
  whatsapp: "919876543210",
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const text = `Hello Vraj Creation!

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Subject: ${formData.subject}
Message: ${formData.message}`;

    const whatsappUrl = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setSubmitted(true);
  };

  const contactItems = [
    {
      icon: MapPin,
      title: "Visit Our Store",
      detail: CONTACT.address,
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: Phone,
      title: "Call Us",
      detail: CONTACT.phone,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Mail,
      title: "Email Us",
      detail: CONTACT.email,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Clock,
      title: "Working Hours",
      detail: "Monday – Saturday, 10 AM – 7 PM",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-100 px-4 py-16 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm">
              <MessageCircle size={17} />
              We'd Love to Hear From You
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Let's Start a
              <span className="block text-orange-600">
                Conversation.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
              Have a question about our products or your order?
              Our team is here to help you find exactly what you're
              looking for.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
              >
                <MessageCircle size={19} />
                Chat on WhatsApp
              </a>

              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 font-bold text-gray-800 transition hover:border-orange-300 hover:text-orange-600"
              >
                Email Us
                <ArrowRight size={18} />
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full bg-orange-200/60 blur-2xl" />
            <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-full bg-amber-200/60 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-3 shadow-2xl shadow-orange-900/10">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85"
                alt="Welcome to our store"
                className="h-72 w-full rounded-2xl object-cover sm:h-96"
              />

              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/50 bg-white/95 p-5 shadow-xl backdrop-blur">
                <p className="text-lg font-extrabold text-gray-900">
                  Your satisfaction matters.
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  We're just one message away.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact information */}
      <section className="px-4 py-14 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-orange-600">
              Get in Touch
            </p>
            <h2 className="mt-3 text-3xl font-black text-gray-900 sm:text-4xl">
              How Can We Help You?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              Reach out to us using any of the contact details below.
              We will be happy to assist you.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {contactItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                >
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon size={23} />
                  </div>

                  <h3 className="font-extrabold text-gray-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 break-words text-sm leading-6 text-gray-500">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="bg-gray-50 px-4 py-14 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-orange-600">
              Contact Us
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight text-gray-900 sm:text-4xl">
              Send Us a Message
            </h2>

            <p className="mt-4 leading-7 text-gray-500">
              Fill out the form with your question or feedback.
              Your message will open in WhatsApp so you can send it
              directly to our team.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-1 shrink-0 text-orange-600" size={20} />
                <p className="text-sm leading-6 text-gray-600">
                  Questions about products and availability
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="mt-1 shrink-0 text-orange-600" size={20} />
                <p className="text-sm leading-6 text-gray-600">
                  Help with orders and delivery
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="mt-1 shrink-0 text-orange-600" size={20} />
                <p className="text-sm leading-6 text-gray-600">
                  Feedback, suggestions and business enquiries
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl shadow-gray-900/5 sm:p-8"
          >
            {submitted && (
              <div className="mb-5 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                WhatsApp has been opened. Send your message there to
                contact our team.
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Your Name *
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Subject *
                </label>
                <input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Your Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Write your message here..."
                  className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-orange-600 px-6 py-4 font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 sm:w-auto"
            >
              Send Message
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>

      {/* Map */}
      <section className="px-4 py-14 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-orange-600">
                Find Us
              </p>
              <h2 className="mt-2 text-3xl font-black text-gray-900">
                Visit Our Location
              </h2>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700"
            >
              Open Google Maps
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
            <iframe
              title="Vraj Creation location map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(CONTACT.address)}&output=embed`}
              width="100%"
              height="350"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}