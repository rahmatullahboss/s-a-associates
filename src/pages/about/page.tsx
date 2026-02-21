"use client";

import { Award, Users, Globe, Heart, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { number: "39+", label: "Partner Universities" },
  { number: "950+", label: "Students Helped" },
  { number: "15+", label: "Years Experience" },
  { number: "98%", label: "Success Rate" },
];

const values = [
  {
    icon: Heart,
    title: "Student-Centered",
    description: "We put students first, ensuring personalized guidance throughout their journey.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "We strive for excellence in every service we provide to our students.",
  },
  {
    icon: Globe,
    title: "Global Perspective",
    description: "We bring international expertise to help students succeed globally.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We build lasting relationships with students, creating a supportive community.",
  },
];

export default function AboutPage() {
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
            About S&A Associates
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/70 text-lg max-w-2xl mx-auto"
          >
            Your trusted partner in achieving educational excellence in Malaysia
          </motion.p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Founded with a vision to bridge the gap between aspiring international students and world-class global education, S&A Associates has been at the forefront of educational consultancy for over 15 years.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                We understand that studying abroad is a life-changing decision. That&apos;s why we&apos;ve dedicated ourselves to making this journey as smooth and successful as possible for every student we serve.
              </p>
              <p className="text-gray-600 leading-relaxed">
                From university selection to visa processing, accommodation arrangements to airport pickup, we handle every detail so students can focus on what matters most – their education and future.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              {stats.map((stat, index) => (
                <div key={index} className="bg-[#F26522]/5 rounded-2xl p-6 text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-[#F26522] mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-[#F26522]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon size={28} className="text-[#F26522]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-gradient-to-br from-[#F26522]/10 to-[#F26522]/20 rounded-2xl p-12 flex items-center justify-center aspect-square">
                <Award size={120} className="text-[#F26522]" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Why Choose S&A Associates?
              </h2>
              <ul className="space-y-4">
                {[
                  "Personalized consultation and guidance",
                  "Direct partnerships with top universities",
                  "High visa approval success rate",
                  "Complete end-to-end support",
                  "Affordable service fees",
                  "Post-arrival assistance",
                ].map((item, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <CheckCircle size={20} className="text-green-500 mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
