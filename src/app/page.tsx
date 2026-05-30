export default function Home() {
  return (
    <div className="container">
      <div className="logo-container">
        <span className="logo-icon">k8s</span>
      </div>
      
      <h1>k8slearn</h1>
      <p className="subtitle">Interactive Kubernetes Certification Learning Platform</p>
      
      <div className="badge">
        <span className="badge-dot"></span>
        Phase 1 Complete
      </div>
      
      <div className="content-box">
        <h3>Deliverables Verified</h3>
        <ul>
          <li>Next.js TypeScript App Scaffolded</li>
          <li>Content repository submodule linked</li>
          <li>Production dependencies installed</li>
          <li>Docker environment configured</li>
        </ul>
      </div>
      
      <div className="footer">
        <span>Content rendering coming in <strong>Phase 2</strong></span>
        <a href="https://github.com/Gautam4424/k8slearn-app" target="_blank" rel="noreferrer">
          View Repository
        </a>
      </div>
    </div>
  );
}
