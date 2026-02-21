"use client";

import { Search, FileText, Home, Plane, FileCheck, HeadphonesIcon, ArrowRight } from "lucide-react";
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";

const services = [
  {
    icon: Search,
    title: "Free Consultation",
    description: "Get personalized advice on course selection, university options, and career pathways. Our experts help you make informed decisions about your education.",
    features: ["One-on-one counseling", "Course recommendations", "Career guidance", "Budget planning"],
  },
  {
    icon: FileText,
    title: "University Admission",
    description: "We handle your entire university application process, ensuring all documents are properly prepared and submitted on time.",
    features: ["Application processing", "Document verification", "Follow-up with universities", "Offer letter assistance"],
  },
  {
    icon: FileCheck,
    title: "Visa Assistance",
    description: "Our visa experts guide you through the entire visa application process, from document preparation to interview preparation.",
    features: ["Document preparation", "Visa application submission", "Interview preparation", "Status tracking"],
  },
  {
    icon: Home,
    title: "Accommodation Support",
    description: "Find the perfect place to stay in Malaysia. We help you secure comfortable and affordable accommodation near your university.",
    features: ["On-campus housing", "Off-campus apartments", "Host family options", "Budget accommodation"],
  },
  {
    icon: Plane,
    title: "Airport Pickup",
    description: "We ensure a smooth arrival in Malaysia with our airport pickup service, transporting you safely to your accommodation.",
    features: ["Airport greeting", "Transport to accommodation", "Welcome orientation", "Local SIM card assistance"],
  },
  {
    icon: HeadphonesIcon,
    title: "Post-Arrival Support",
    description: "Our support doesn't end when you arrive. We continue to assist you throughout your stay in Malaysia.",
    features: ["University registration", "Bank account opening", "Medical checkup", "Ongoing counseling"],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-[#1E293B] to-[#334155] py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Our Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/70 text-lg max-w-2xl mx-auto"
          >
            Comprehensive support from application to arrival and beyond
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-[#F26522]/10 rounded-2xl flex items-center justify-center mb-6">
                  <service.icon size={32} className="text-[#F26522]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-[#1E293B] rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/contact"
                  className="inline-flex items-center text-[#F26522] font-medium hover:underline"
                >
                  Learn More
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to start your educational journey in Malaysia
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: "1", title: "Consultation", desc: "Free counseling session" },
              { step: "2", title: "Application", desc: "Submit documents" },
              { step: "3", title: "Admission", desc: "Get offer letter" },
              { step: "4", title: "Visa", desc: "Apply for student visa" },
              { step: "5", title: "Arrival", desc: "Start your journey" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#1E293B] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
