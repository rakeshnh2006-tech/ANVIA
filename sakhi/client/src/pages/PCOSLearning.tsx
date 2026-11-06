import React, { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react'
import { MedicalDisclaimer } from '../components/ui/States'

interface Topic {
  id: string
  title: string
  badge?: string
  content: string[]
}

const TOPICS: Topic[] = [
  {
    id: 'what-is-pcos',
    title: 'What is PCOS?',
    badge: 'Foundation',
    content: [
      'Polycystic Ovary Syndrome (PCOS) is one of the most common hormonal conditions affecting people with ovaries, estimated to affect 1 in 10 during reproductive years.',
      'PCOS involves a combination of symptoms related to hormone levels, menstrual cycles and sometimes the appearance of small follicles on ovaries seen on ultrasound.',
      'Despite its name, you do not need to have cysts to be diagnosed with PCOS. The term "polycystic" refers to the appearance of multiple small follicles on ovaries, which is not the same as true cysts.',
      'PCOS is a syndrome — a collection of signs and symptoms — not a single disease with a single cause. The exact cause is not fully understood.',
      'Important: PCOS is diagnosed by a healthcare professional after clinical assessment, blood tests and sometimes pelvic ultrasound. Symptoms alone are not sufficient for diagnosis.',
    ],
  },
  {
    id: 'common-symptoms',
    title: 'Common Symptoms',
    badge: 'Overview',
    content: [
      'Irregular, infrequent or absent menstrual periods (oligomenorrhoea or amenorrhoea)',
      'Excess androgen — signs may include acne, excess facial or body hair (hirsutism), or male-pattern hair thinning',
      'Polycystic-appearing ovaries on ultrasound (small follicles arranged around the outer edge)',
      'Weight gain, especially around the abdomen',
      'Oily skin or acne',
      'Skin darkening in neck creases, groin or under breasts (acanthosis nigricans)',
      'Fatigue or difficulty with energy levels',
      'Mood changes, including anxiety and low mood',
      'Many people with PCOS have few or no visible symptoms. Severity varies widely between individuals.',
      'Important: These symptoms can also have other causes. Only a healthcare professional can determine the cause.',
    ],
  },
  {
    id: 'irregular-periods',
    title: 'Understanding Irregular Periods',
    badge: 'Menstrual Health',
    content: [
      'A typical menstrual cycle ranges from 21 to 35 days. Cycles outside this range, or that vary significantly each month, are considered irregular.',
      'Irregular periods in PCOS are often caused by disrupted ovulation. When ovulation does not occur consistently, periods may be delayed, skipped or unpredictable.',
      'However, irregular periods are extremely common and can result from many causes: stress, significant weight change, thyroid disorders, elevated prolactin, perimenopause, intense exercise, nutritional deficiency and more.',
      'For adolescents: Irregular cycles are normal in the first 2–3 years after periods begin. Applying PCOS diagnostic criteria to adolescents requires extra caution.',
      'If your periods have been irregular for more than 3 months, a consultation with a healthcare professional is recommended.',
    ],
  },
  {
    id: 'acne-and-hair',
    title: 'Acne and Excess Facial Hair',
    badge: 'Androgen Effects',
    content: [
      'Elevated androgens (sometimes called "male hormones," though all bodies produce them) can cause acne, particularly on the jaw, chin and cheeks.',
      'Hirsutism (excess facial or body hair in a male-pattern distribution) affects approximately 70–80% of people with elevated androgen levels.',
      'Hair growth on the upper lip, chin, chest, lower abdomen or inner thighs, beyond your usual pattern, may be worth discussing with a doctor.',
      'Acne and hirsutism can significantly affect quality of life and self-esteem. These are valid medical concerns, not cosmetic-only issues.',
      'Both acne and hirsutism can have causes other than PCOS, including adrenal conditions and medications.',
    ],
  },
  {
    id: 'hair-thinning',
    title: 'Hair Thinning',
    badge: 'Androgenic Alopecia',
    content: [
      'Some people with PCOS experience hair thinning on the scalp, particularly at the crown or along the parting (androgenic alopecia).',
      'This occurs when hair follicles become sensitive to androgens, leading to shorter, finer hair growth cycles.',
      'Hair loss can be distressing. It is worth tracking whether it is gradual or sudden, and whether it is accompanied by other symptoms.',
      'Thyroid disorders, nutritional deficiencies (especially iron and ferritin), and other hormonal conditions can also cause hair thinning.',
      'A blood test panel from your doctor can help identify the underlying cause.',
    ],
  },
  {
    id: 'metabolic-health',
    title: 'PCOS and Metabolic Health',
    badge: 'Metabolism',
    content: [
      'Many people with PCOS have insulin resistance — the body\'s cells don\'t respond to insulin as effectively as they should.',
      'Insulin resistance can contribute to higher androgen levels (worsening PCOS symptoms) and increases the risk of developing type 2 diabetes over time.',
      'Regular blood sugar monitoring and lifestyle measures (balanced nutrition, regular movement) are important for metabolic health.',
      'Not everyone with PCOS has insulin resistance — it is more common in those who are overweight, but lean individuals with PCOS can also have insulin resistance.',
      'If you have PCOS, your healthcare provider may recommend periodic blood glucose and lipid testing.',
    ],
  },
  {
    id: 'emotional-wellbeing',
    title: 'PCOS and Emotional Wellbeing',
    badge: 'Mental Health',
    content: [
      'Living with PCOS can affect emotional wellbeing significantly. Research shows higher rates of anxiety, depression and body image concerns among people with PCOS.',
      'This is partly driven by visible symptoms (acne, hair changes, weight), but also by the hormonal environment itself.',
      'Feeling frustrated, worried or upset about PCOS symptoms is completely valid and understandable.',
      'Talking to a healthcare professional or counsellor about the emotional aspects of PCOS is just as important as managing physical symptoms.',
      'Support communities — both in person and online — can provide connection with others who understand the experience.',
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle and Wellbeing',
    badge: 'Self-care',
    content: [
      'Lifestyle factors can influence PCOS symptoms, though no lifestyle change can "cure" PCOS.',
      'Regular physical activity of any kind (walking, yoga, dancing) supports insulin sensitivity and hormonal balance.',
      'A balanced, varied diet — not a restrictive one — focusing on whole grains, vegetables, lean proteins and healthy fats is generally beneficial.',
      'Adequate sleep (7–9 hours for most adults) plays an important role in hormonal regulation.',
      'Stress management (mindfulness, breathing exercises, social connection) can help, as chronic stress influences cortisol and hormone balance.',
      'Any weight change, if relevant, should be approached in a health-focused, sustainable and non-restrictive way in partnership with a healthcare professional.',
    ],
  },
  {
    id: 'evaluation',
    title: 'How Healthcare Professionals Evaluate PCOS',
    badge: 'Diagnosis',
    content: [
      'PCOS is typically diagnosed using the Rotterdam criteria, which requires at least two of three features: irregular or absent ovulation, elevated androgen levels (or signs of hyperandrogenism), and polycystic-appearing ovaries on ultrasound.',
      'Blood tests typically assess: LH, FSH, total and free testosterone, DHEA-S, prolactin, thyroid function (TSH), fasting glucose and insulin.',
      'Pelvic ultrasound alone does NOT confirm PCOS. Polycystic-appearing ovaries are also found in people without PCOS.',
      'Other conditions must be ruled out before a PCOS diagnosis, including thyroid disorders, elevated prolactin (hyperprolactinaemia), adrenal conditions and other hormonal conditions.',
      'A diagnosis takes time and requires a thorough clinical assessment — it should not be made based on an app, AI tool or self-assessment.',
    ],
  },
  {
    id: 'treatment',
    title: 'Treatment Options (Discussed with Healthcare Professionals)',
    badge: 'Management',
    content: [
      'PCOS management is individualized — there is no single treatment for everyone. Discuss all options with your healthcare provider.',
      'Hormonal contraceptives (combined oral contraceptive pills): Regulate periods and reduce androgen-related symptoms for some people.',
      'Metformin: An insulin-sensitizing medication sometimes used for metabolic management and cycle regulation in PCOS. Requires medical prescription and monitoring.',
      'Anti-androgen medications: May reduce hirsutism or acne when prescribed by a doctor.',
      'Letrozole or clomiphene: Used for ovulation induction when pregnancy is desired — requires specialist supervision.',
      'Lifestyle interventions: Diet, exercise and stress management are recommended as first-line approaches for many people.',
      'Important: SAKHI does not recommend medications. All treatment decisions must be made with a qualified healthcare professional who knows your full medical history.',
    ],
  },
]

const FAQ_ITEMS = [
  { q: 'Can PCOS be cured?', a: 'PCOS is a lifelong condition that can be managed but not cured. Symptoms can improve significantly with appropriate management, and for some people, symptoms improve after menopause.' },
  { q: 'Does PCOS always affect fertility?', a: 'Not always. Many people with PCOS conceive without difficulty. Some require support with ovulation induction. Fertility concerns should be discussed with a specialist.' },
  { q: 'Can I have PCOS if my periods are regular?', a: 'Yes. Some people have PCOS with regular periods if they still have elevated androgens and polycystic-appearing ovaries. The condition presents differently in different people.' },
  { q: 'Is PCOS genetic?', a: 'There is a genetic component — PCOS tends to run in families. However, genes are not destiny, and lifestyle and environment also play a role.' },
  { q: 'What age can PCOS be diagnosed?', a: 'PCOS can be diagnosed after puberty. In adolescents, the criteria are applied more cautiously because some features (irregular periods, polycystic-appearing ovaries) are normal in early puberty.' },
  { q: 'Does everyone with PCOS gain weight?', a: 'No. PCOS affects people of all body sizes. While weight gain can be a symptom for some, lean-phenotype PCOS is well-documented.' },
]

function TopicCard({ topic }: { topic: Topic }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lavender-100 flex items-center justify-center flex-shrink-0">
            <BookOpen size={15} className="text-lavender-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sakhi-text text-sm">{topic.title}</h3>
            {topic.badge && <span className="badge-lavender mt-0.5">{topic.badge}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-sakhi-muted flex-shrink-0" /> : <ChevronDown size={18} className="text-sakhi-muted flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-sakhi-border space-y-2">
          {topic.content.map((para, i) => (
            <p key={i} className="text-sm text-sakhi-muted leading-relaxed">
              {para.startsWith('Important:') || para.startsWith('Note:') ? (
                <span className="font-medium text-amber-700">{para}</span>
              ) : para}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-sakhi-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-sakhi-text">{q}</span>
        {open ? <ChevronUp size={16} className="text-sakhi-muted flex-shrink-0" /> : <ChevronDown size={16} className="text-sakhi-muted flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-sakhi-muted bg-gray-50 border-t border-sakhi-border">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function PCOSLearning() {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const badges = ['all', ...Array.from(new Set(TOPICS.map(t => t.badge).filter(Boolean)))] as string[]

  const filtered = activeFilter === 'all' ? TOPICS : TOPICS.filter(t => t.badge === activeFilter)

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">PCOS Learning Centre</h1>
        <p className="section-subtitle">
          Evidence-based educational content about PCOS. Educational information only — not a substitute for professional medical advice.
        </p>
      </div>

      {/* Last reviewed */}
      <div className="bg-lavender-50 border border-lavender-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-xs text-lavender-700">
        <BookOpen size={14} />
        Content reviewed: December 2024 · Sources: WHO, Rotterdam PCOS Consortium, MoHFW India, PCOS Society of India
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {badges.map(badge => (
          <button
            key={badge}
            onClick={() => setActiveFilter(badge)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors
              ${activeFilter === badge
                ? 'bg-lavender-600 text-white'
                : 'bg-white border border-sakhi-border text-sakhi-muted hover:border-lavender-400 hover:text-lavender-700'
              }`}
          >
            {badge === 'all' ? 'All topics' : badge}
          </button>
        ))}
      </div>

      {/* Topics */}
      <div className="space-y-3 mb-10">
        {filtered.map(topic => <TopicCard key={topic.id} topic={topic} />)}
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-sakhi-text mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map(faq => <FaqItem key={faq.q} {...faq} />)}
        </div>
      </div>

      {/* Sources */}
      <div className="card bg-gray-50 border-sakhi-border">
        <h3 className="text-sm font-semibold text-sakhi-text mb-3">Information Sources</h3>
        <ul className="space-y-1 text-xs text-sakhi-muted">
          <li>· World Health Organization (WHO) — Women's Health Guidelines</li>
          <li>· Rotterdam ESHRE/ASRM-Sponsored PCOS Consensus Workshop Group</li>
          <li>· Ministry of Health and Family Welfare, Government of India</li>
          <li>· PCOS Society of India — Clinical Practice Guidelines</li>
          <li>· The Endocrine Society Clinical Practice Guideline on PCOS (2023)</li>
        </ul>
      </div>

      <MedicalDisclaimer className="mt-6" />
    </div>
  )
}
