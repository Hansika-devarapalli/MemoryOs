import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  Brain, Search, Shield, Zap, Database, ArrowRight,
  FileText, Image as ImageIcon, FileCode, AlignLeft,
} from 'lucide-react';

const EXAMPLES = [
  'Find the PDF I studied before my ML exam',
  'Show me screenshots with Python errors',
  'What did I write about transformers?',
  'Find my internship resume',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/6 text-primary text-xs font-medium mb-8">
            <span className="status-dot active" />
            Runs entirely on your device — no cloud
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight mb-5">
            Remember anything.<br />
            <span className="text-gradient">Instantly.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Your private AI-powered digital memory that runs entirely on your device.
            Search files, documents, and images with natural language — no filenames required.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/dashboard">
              <div className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                Open Workspace <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 bg-secondary text-foreground text-sm font-medium px-5 py-2.5 rounded-lg border border-border hover:bg-secondary/70 transition-colors"
            >
              How it works
            </a>
          </div>
        </motion.div>

        {/* Demo bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 w-full max-w-2xl"
        >
          <SearchDemo />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-secondary/40 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Your second brain. Local.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything runs on your machine. Your data never leaves your computer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Brain,    title: 'Semantic Search',  desc: 'Ask naturally — "sourdough recipe" finds "sourdough_v2.pdf" automatically.' },
              { icon: Shield,   title: 'Private by Design', desc: '100% local LLMs and embeddings. No API keys, no cloud uploads.' },
              { icon: Zap,      title: 'Fast Retrieval',   desc: 'Local vector indices give millisecond search across thousands of files.' },
              { icon: Database, title: 'Reads Everything', desc: 'PDFs, Word docs, Markdown, and OCR from images and screenshots.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
            <p className="text-muted-foreground">Four steps from query to answer</p>
          </div>
          <div className="grid sm:grid-cols-4 gap-6 relative">
            {[
              { step: '1', title: 'Index',  desc: 'MemoryOS scans your watched folders and extracts text from every file.' },
              { step: '2', title: 'Embed',  desc: 'nomic-embed-text converts text into semantic vectors stored in ChromaDB.' },
              { step: '3', title: 'Search', desc: 'Your query is embedded and matched against your personal vector index.' },
              { step: '4', title: 'Answer', desc: 'Gemma 3 generates a plain-English answer from the top matching documents.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {step}
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-foreground">MemoryOS</span>
          </div>
          <p>Open source · Local first · Privacy by default</p>
        </div>
      </footer>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 outline-none">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground">MemoryOS</span>
        </Link>
        <div className="flex items-center gap-4">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Features
          </a>
          <Link href="/dashboard">
            <div className="text-sm font-medium bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
              Open App
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function SearchDemo() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card p-4 shadow-md">
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary border border-border">
        <Search className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 h-5 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-muted-foreground absolute inset-0 flex items-center"
            >
              {EXAMPLES[idx]}
            </motion.p>
          </AnimatePresence>
        </div>
        <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">↵</kbd>
      </div>

      {/* Mock results */}
      <div className="mt-3 space-y-2">
        {[
          { icon: FileText,  name: 'Machine_Learning_Notes_Final.pdf', score: 97, type: 'PDF' },
          { icon: FileCode,  name: 'transformer_architecture.md',       score: 84, type: 'Markdown' },
          { icon: ImageIcon, name: 'ml_exam_study_screenshot.png',      score: 71, type: 'Image / OCR' },
        ].map(({ icon: Icon, name, score, type }) => (
          <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground">{type}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              score >= 90 ? 'bg-green-50 text-green-700' :
              score >= 75 ? 'bg-blue-50 text-blue-700' :
              'bg-orange-50 text-orange-700'
            }`}>
              {score}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
