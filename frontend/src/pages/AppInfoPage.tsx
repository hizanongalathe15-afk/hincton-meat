import { useSiteContent } from '../contexts/SiteContentContext'
import { Smartphone, Info, Shield, Database, Mail } from 'lucide-react'
import LinkifiedText from '../components/ui/LinkifiedText'

const AppInfoPage = () => {
  const { profile } = useSiteContent()
  const brand = profile.brand
  const appInfo = profile.appInfo

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">{brand.name}</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">App Information</h1>
          <p className="mt-4 max-w-3xl text-gray-300">
            Learn more about the Hincton Meat Products app, its features, and how we protect your data.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* App Details */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-950">App Details</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <span className="text-sm font-medium text-gray-700">Version</span>
              <p className="text-lg font-semibold text-gray-950">{appInfo.version}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Build</span>
              <p className="text-lg font-semibold text-gray-950">{appInfo.build}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Platform</span>
              <p className="text-lg font-semibold text-gray-950">{appInfo.platform}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Last Updated</span>
              <p className="text-lg font-semibold text-gray-950">{appInfo.lastUpdated}</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Info className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-950">Key Features</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {appInfo.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-600"></div>
                <span className="text-gray-700"><LinkifiedText text={feature} /></span>
              </div>
            ))}
          </div>
        </section>

        {/* Permissions */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-950">Permissions & Data Usage</h2>
          </div>
          <p className="text-gray-700 mb-4">
            We only request permissions necessary for the app's core functionality. All data is handled according to our privacy policy.
          </p>
          <ul className="space-y-2">
            {appInfo.permissions.map((permission, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-red-600 mt-2"></div>
                <span className="text-gray-700"><LinkifiedText text={permission} /></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Info className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-950">Channel Reports</h2>
          </div>
          <ul className="space-y-2">
            {appInfo.channelReports.map((report, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-red-600 mt-2"></div>
                <span className="text-gray-700"><LinkifiedText text={report} /></span>
              </li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-950">Contact & Support</h2>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Developer</span>
              <p className="text-gray-950">Hincton Meat Products</p>
              <p className="text-gray-950">{appInfo.developerContact}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Email</span>
              <p className="text-gray-950">{brand.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Phone</span>
              <p className="text-gray-950">{brand.phone}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Website</span>
              <p className="text-gray-950">{brand.website}</p>
            </div>
          </div>
        </section>

        {/* Legal */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-950">Legal & Privacy</h2>
          </div>
          <div className="space-y-3">
            {appInfo.legalNotices.map((notice, index) => (
              <p key={index} className="text-gray-700"><LinkifiedText text={notice} /></p>
            ))}
            <a href="/terms" className="block text-red-600 hover:text-red-800">
              Terms and Conditions
            </a>
            <a href="/privacy" className="block text-red-600 hover:text-red-800">
              Privacy Policy
            </a>
            <a href="/help" className="block text-red-600 hover:text-red-800">
              Help Center
            </a>
            <a href="/feedback" className="block text-red-600 hover:text-red-800">
              Send Feedback
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AppInfoPage
