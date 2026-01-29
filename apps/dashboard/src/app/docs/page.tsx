export default function DocsPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Introduction */}
      <section id="introduction" className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Introduction</h1>
          <p className="text-xl text-zinc-400">The Face ID you actually own.</p>
        </div>
        <div className="prose prose-invert max-w-none text-zinc-300">
          <p className="leading-relaxed">
            IzzU is a self-hosted, open-source biometric authentication platform designed to replace
            expensive cloud providers like Auth0 or AWS Rekognition. It runs entirely on your
            infrastructure, ensuring <strong className="text-white">zero data leakage</strong> and{" "}
            <strong className="text-white">zero vendor lock-in</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card title="AES-256" value="Encrypted Face Vectors" />
            <Card title="99.38%" value="Recognition Accuracy" />
            <Card title="Zero" value="Cloud Dependencies" />
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="space-y-6 pt-10 border-t border-zinc-900">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-500">#</span> Architecture
        </h2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <p className="text-zinc-400">
            IzzU uses a multi-layered approach to security, combining high-performance Python
            engines with a scalable Next.js frontend.
          </p>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex gap-2">
              <span className="text-blue-500 font-mono">Face Engine:</span> Python 3.11 + dlib
              (ResNet) + OpenCV
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 font-mono">Liveness:</span> MediaPipe 468-point Mesh +
              Laplacian Variance
            </li>
            <li className="flex gap-2">
              <span className="text-purple-500 font-mono">Storage:</span> PostgreSQL (User Data) +
              Redis (Sessions)
            </li>
            <li className="flex gap-2">
              <span className="text-orange-500 font-mono">Encryption:</span> AES-256-GCM (Simulated
              Secure Enclave)
            </li>
          </ul>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="space-y-6 pt-10 border-t border-zinc-900">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-500">#</span> Security Model
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">Anti-Spoofing</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We use <strong>Laplacian Variance</strong> to detect "flat" images (screens, printed
              photos). Additionally, <strong>Eye Aspect Ratio (EAR)</strong> tracking ensures the
              user is blinking and alive, while <strong>Head Pose Estimation</strong> confirms they
              are looking directly at the camera.
            </p>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">Secure Enclave</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Raw face images are <strong>never stored</strong> for recognition. We generate a
              128-dimensional mathematical vector, encrypt it using <strong>AES-256-GCM</strong>{" "}
              with a master key, and store only the cipher blob.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="space-y-6 pt-10 border-t border-zinc-900">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-500">#</span> Quick Start
        </h2>
        <p className="text-zinc-400">Deploy the entire stack using Docker in under 2 minutes.</p>

        <CodeBlock
          code={`# 1. Clone Repo
git clone https://github.com/thisistanishq/izzu.git
cd izzu

# 2. Configure Secrets
cp .env.example .env

# 3. Launch
docker compose up -d --build`}
        />
      </section>

      {/* Web SDK */}
      <section id="sdk" className="space-y-6 pt-10 border-t border-zinc-900">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-500">#</span> Web SDK Integration
        </h2>
        <p className="text-zinc-400">Add Face ID to your React/Next.js app.</p>
        <CodeBlock
          code={`import { IzzUProvider } from "@izzu/react";

export default function App() {
  return (
    <IzzUProvider apiKey="pk_live_..." projectId="...">
       <LoginPage />
    </IzzUProvider>
  );
}`}
        />
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
      <div className="text-xs text-zinc-500 uppercase font-mono mb-1">{title}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      <div className="relative bg-zinc-950 rounded-lg border border-zinc-800 p-4 overflow-x-auto">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center p-1" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center p-1" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center p-1" />
          </div>
          <div className="text-xs text-zinc-500 font-mono ml-2">bash</div>
        </div>
        <pre className="font-mono text-sm text-zinc-300">{code}</pre>
      </div>
    </div>
  );
}
