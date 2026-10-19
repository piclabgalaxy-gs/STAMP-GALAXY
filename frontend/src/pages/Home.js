```jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Stamp,
  ShieldCheck,
  FileCheck2,
  Search,
  CreditCard,
  ArrowRight,
  Quote,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

const HERO_IMG = "/estamp-hero.jpg";

const services = [
  {
    icon: FileCheck2,
    title: "Sale Deed & Banakhat",
    desc: "Online e-stamping for sale deeds and agreements to sell with accurate Gujarat stamp duty.",
  },
  {
    icon: Stamp,
    title: "Gift & Settlement Deed",
    desc: "E-stamping for gift deeds, settlement deeds and family transfers across Gujarat.",
  },
  {
    icon: ShieldCheck,
    title: "Rent & Lease Agreement",
    desc: "E-stamping for rent and lease agreements with verifiable e-stamp certificates.",
  },
  {
    icon: CreditCard,
    title: "Affidavit & Bonds",
    desc: "Online e-stamping for affidavits, indemnity bonds and power of attorney.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Choose your document",
    desc: "Pick the stamp duty article for your document from our searchable Gujarat list.",
  },
  {
    icon: FileCheck2,
    title: "Fill the e-stamping form",
    desc: "Enter party details and consideration. Your progress saves automatically.",
  },
  {
    icon: CreditCard,
    title: "Complete the payment process",
    desc: "Follow the payment instructions provided for your application.",
  },
  {
    icon: Stamp,
    title: "Get your e-stamp certificate",
    desc: "Receive your e-stamp certificate through the applicable process.",
  },
];

const fallbackTestimonials = [
  {
    customer_name: "Rajesh Patel",
    rating: 5,
    text: "DocGalaxy made e-stamping in Gujarat effortless. Got my sale deed e-stamp certificate the same day!",
    img: "https://images.unsplash.com/photo-1649433658557-54cf58577c68?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwwfHx8fDE3OTE0NDQ2MTh8MA&ixlib=rb-4.1.0&q=85",
  },
  {
    customer_name: "Priya Shah",
    rating: 5,
    text: "The online e-stamping form is simple. Auto-save meant I could finish my rent agreement later. Highly recommended.",
    img: "https://images.unsplash.com/photo-1598411435746-47bfecc3ea98?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwwfHx8fDE3OTE0NDQ2MTh8MA&ixlib=rb-4.1.0&q=85",
  },
  {
    customer_name: "Amit Desai",
    rating: 4,
    text: "A helpful e-stamping experience with transparent stamp duty information and support.",
    img: null,
  },
];

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [faqs, setFaqs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/faqs").then((r) => setFaqs(r.data)).catch(() => {});
    api.get("/reviews").then((r) => setReviews(r.data)).catch(() => {});
  }, []);

  const testimonials =
    reviews.length > 0 ? reviews : fallbackTestimonials;

  const avgRating = testimonials.length
    ? (
        testimonials.reduce((a, t) => a + (t.rating || 0), 0) /
        testimonials.length
      ).toFixed(1)
    : "5.0";

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://galaxystamp.com/#organization",
        name: "Galaxy Stamp",
        url: "https://galaxystamp.com/",
        logo: "https://galaxystamp.com/galaxy-stamp-logo.jpg",
        description:
          "Online e-stamping application service for documents in Gujarat.",
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Gujarat, India",
        },
      },
      {
        "@type": "Service",
        name: "Online E-Stamping Gujarat",
        serviceType: "E-Stamping Application Service",
        provider: {
          "@id": "https://galaxystamp.com/#organization",
        },
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Gujarat, India",
        },
        url: "https://galaxystamp.com/",
      },
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: f.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  const startEstamping = () => {
    if (user && user.role === "customer") {
      navigate("/estamping");
    } else {
      navigate("/login");
    }
  };

  const submitReview = async () => {
    if (!user || user.role !== "customer") {
      toast.error("Please login as a customer to leave a review.");
      navigate("/login");
      return;
    }

    if (myRating < 1) {
      toast.error("Please select a star rating.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/reviews", {
        rating: myRating,
        text: myText,
      });

      toast.success("Thank you! Your review is submitted for approval.");
      setMyRating(0);
      setMyText("");
    } catch (e) {
      toast.error("Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <SEO
        title="E-Stamping Gujarat | Online E-Stamp Service - Galaxy Stamp"
        description="Looking for e-stamping in Gujarat? Galaxy Stamp helps you submit e-stamping applications online for rent agreements, sale deeds, affidavits and other documents."
        keywords="Galaxy Stamp, e-stamping Gujarat, e-stamp Gujarat, online e-stamping, e-stamp certificate, Gujarat stamp duty"
        path="/"
        schema={schema}
      />

      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="grain-overlay" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fade}
            custom={0}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              E-Stamping Service · Gujarat
            </span>

            <h1 className="mt-6 font-head text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Online <span className="text-blue-600">E-Stamping</span> in
              Gujarat,{" "}
              <span className="text-slate-900">Made Simple.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Galaxy Stamp helps customers submit e-stamping applications
              for documents such as sale deeds, gift deeds, rent agreements
              and affidavits in Gujarat.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                data-testid="hero-start-estamping-btn"
                onClick={startEstamping}
                size="lg"
                className="group gap-2 bg-slate-900 text-white hover:bg-slate-800"
              >
                Start E-Stamping
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                data-testid="hero-learn-btn"
                variant="outline"
                size="lg"
                onClick={() =>
                  document
                    .getElementById("how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="border-slate-300"
              >
                How It Works
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <StarRating
                  value={Math.round(Number(avgRating))}
                  readOnly
                  size={18}
                />
                <span className="text-sm font-semibold text-slate-700">
                  {avgRating}/5
                </span>
              </div>

              <span className="text-sm text-slate-500">
                Customer ratings
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <img
                src={HERO_IMG}
                alt="E-stamp certificate for e-stamping in Gujarat"
                className="h-[420px] w-full bg-white object-cover object-top"
              />
            </div>

            <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  E-Stamp Application
                </p>
                <p className="text-xs text-slate-500">
                  Application status available through your account
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <h2 className="font-head text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            E-Stamping Services
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Explore e-stamping application support for common document types
            in Gujarat.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fade}
              custom={i}
            >
              <Card className="h-full border border-slate-200 bg-white p-6 transition-transform hover:-translate-y-1 hover:shadow-lg">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white">
                  <s.icon className="h-6 w-6" aria-hidden="true" />
                </span>

                <h3 className="mt-5 font-head text-lg font-semibold text-slate-900">
                  {s.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-head text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How Online E-Stamping Works
          </h2>

          <p className="mt-4 max-w-2xl text-base text-slate-600">
            Follow the steps provided in your Galaxy Stamp account to submit
            an e-stamping application.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fade}
                custom={i}
                className="relative"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-head text-2xl font-bold text-slate-200">
                    0{i + 1}
                  </span>
                </div>

                <h3 className="mt-4 font-head text-lg font-semibold text-slate-900">
                  {s.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="testimonials"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="font-head text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Customer Reviews
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-600">
              Read customer feedback about their e-stamping experience.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.slice(0, 6).map((t, i) => (
            <motion.div
              key={t.id || i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fade}
              custom={i}
            >
              <Card
                className="flex h-full flex-col border border-slate-200 bg-white p-6"
                data-testid={`testimonial-${i}`}
              >
                <Quote
                  className="h-7 w-7 text-amber-400"
                  aria-hidden="true"
                />
                <StarRating value={t.rating} readOnly size={16} />

                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">
                  "{t.text}"
                </p>

                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  {t.img ? (
                    <img
                      src={t.img}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {(t.customer_name || "C").charAt(0)}
                    </span>
                  )}

                  <span className="text-sm font-semibold text-slate-900">
                    {t.customer_name || "Customer"}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Leave a review */}
        <Card
          className="mt-12 border border-slate-200 bg-white p-6 sm:p-8"
          data-testid="leave-review-card"
        >
          <h3 className="font-head text-xl font-semibold text-slate-900">
            Leave a Review
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Share your e-stamping experience. Reviews appear after admin
            approval.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">
              Your rating:
            </span>
            <StarRating
              value={myRating}
              onChange={setMyRating}
              size={26}
              testId="review-rating"
            />
          </div>

          <Textarea
            data-testid="review-text-input"
            value={myText}
            onChange={(e) => setMyText(e.target.value)}
            placeholder="Tell us about your e-stamping experience..."
            className="mt-4 min-h-[90px] border-slate-300"
          />

          <Button
            data-testid="submit-review-btn"
            onClick={submitReview}
            disabled={submitting}
            className="mt-4 bg-slate-900 text-white hover:bg-slate-800"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </Card>
      </section>

      {/* FAQ / Q&A */}
      <section id="faq" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-head text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            E-Stamping Questions & Answers
          </h2>

          <p className="mt-4 text-base text-slate-600">
            Common questions about e-stamping, stamp duty and e-stamp
            certificates in Gujarat.
          </p>

          <Accordion
            type="single"
            collapsible
            className="mt-10"
            data-testid="faq-accordion"
          >
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-slate-200"
                data-testid={`faq-item-${i}`}
              >
                <AccordionTrigger className="text-left font-head text-base font-semibold text-slate-900 hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-slate-600">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-head text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to start your e-stamping application?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
            Visit your Galaxy Stamp account to start an e-stamping
            application.
          </p>

          <Button
            data-testid="cta-start-btn"
            onClick={startEstamping}
            size="lg"
            className="mt-8 gap-2 bg-amber-400 text-slate-900 hover:bg-amber-300"
          >
            Start E-Stamping Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
