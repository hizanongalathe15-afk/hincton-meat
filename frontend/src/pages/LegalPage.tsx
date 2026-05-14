import { Link } from 'react-router-dom'
import { HINCTON_BRAND } from '../utils/hinctonBrand'

type LegalPageProps = {
  type: 'terms' | 'privacy'
}

const updatedDate = 'May 14, 2026'

const termsSections = [
  {
    title: '1. Agreement To These Terms',
    body: 'By creating an account, browsing products, adding items to cart, placing an order, paying through M-PESA, card, cash on delivery, or using support chat, you agree to these Terms and Conditions. If you do not agree, you should not use the website or place an order. These terms apply to buyers, guests, account holders, and any person acting on behalf of a buyer.',
  },
  {
    title: '2. Account Registration And Security',
    body: 'You must provide accurate names, email addresses, phone numbers, delivery details, and payment information. You are responsible for keeping your password, OTP, and device access secure. Activity from your account may be treated as your activity. Notify Hincton Meat Products immediately if you believe your account, phone, email, or device has been misused.',
  },
  {
    title: '3. Product Information, Weights, And Availability',
    body: 'Product names, images, descriptions, prices, pack sizes, weight units, and availability are managed through the platform and may change based on stock, supplier availability, preparation method, or market price. Meat products can have natural weight variation. We aim to keep product data accurate, but availability is confirmed at order processing and checkout stock validation.',
  },
  {
    title: '4. Orders, Holds, And Stock',
    body: 'Adding a product to cart does not complete a purchase. Stock is confirmed when an order is submitted and accepted by the system. If multiple customers attempt to buy limited stock, the system validates available quantity before creating the order. Hincton Meat Products may cancel, adjust, or contact you about an order if stock, pricing, delivery, payment, address, or compliance issues arise.',
  },
  {
    title: '5. Pricing, Payment, And Taxes',
    body: 'Prices are shown in the currency displayed by the platform, commonly Kenya shillings for local orders. Delivery fees, promotions, discounts, taxes, and payment charges may apply. M-PESA payments require the buyer to approve the STK prompt or complete the provided payment flow. An order may remain pending until payment is confirmed.',
  },
  {
    title: '6. Delivery, Location, And Order Tracking',
    body: 'You must provide a real delivery address and, where available, a map pin or GPS location. If browser location permission is denied, you may enter the address manually and use the map preview to confirm the destination. Delivery times are estimates and may be affected by traffic, weather, stock preparation, payment confirmation, address accuracy, customer availability, or events beyond our control.',
  },
  {
    title: '7. Fresh Food Handling',
    body: 'Meat and perishable products require proper handling after delivery. You are responsible for receiving the order on time, refrigerating or freezing products as appropriate, and following food safety guidance. Hincton Meat Products is not responsible for spoilage caused by delayed collection, incorrect storage, or inability to reach the buyer at the provided contact details.',
  },
  {
    title: '8. Returns, Refunds, And Complaints',
    body: 'Because meat is perishable, returns may be limited. If there is a quality, quantity, delivery, or payment issue, contact support promptly with the order number, photos where relevant, and a clear description. Refunds, replacements, credits, or order adjustments are reviewed case by case according to product condition, timing, evidence, and applicable consumer protection rules.',
  },
  {
    title: '9. Messaging, Reviews, And User Content',
    body: 'You may send messages, contact forms, chats, reviews, images, or profile details through the website. You agree not to submit abusive, illegal, misleading, fraudulent, obscene, threatening, or infringing content. Hincton Meat Products may moderate, remove, or restrict content or accounts that harm users, staff, systems, or business operations.',
  },
  {
    title: '10. Acceptable Use',
    body: 'You must not attack, scrape, overload, reverse engineer, bypass authentication, abuse coupons, impersonate another person, upload malware, exploit bugs, or use the website for illegal activity. We may limit, suspend, or terminate access if we detect misuse, suspicious payments, fraud, security risk, or repeated policy violations.',
  },
  {
    title: '11. Admin Actions And Service Changes',
    body: 'Admins may update products, prices, stock, delivery settings, order statuses, content, promotions, and customer support responses. The website may change, pause, or remove features to improve service, fix bugs, meet legal requirements, or protect users and business operations.',
  },
  {
    title: '12. Limitation Of Liability',
    body: 'To the maximum extent allowed by law, Hincton Meat Products is not liable for indirect, incidental, special, punitive, or consequential losses, including lost profits, lost data, business interruption, device issues, third-party payment downtime, mapping errors, or delays outside reasonable control.',
  },
  {
    title: '13. Governing Law And Contact',
    body: 'These terms are intended to operate under applicable Kenyan law for local transactions unless another written agreement applies. For questions, disputes, or support, contact Hincton Meat Products using the phone, email, or contact page provided on the website.',
  },
]

const privacySections = [
  {
    title: '1. Privacy Commitment',
    body: 'This Privacy Policy explains how Hincton Meat Products collects, uses, stores, protects, and shares personal information when you visit the website, create an account, upload a profile image, place an order, pin a delivery location, contact support, or use messaging features.',
  },
  {
    title: '2. Information We Collect',
    body: 'We may collect your name, email address, phone number, account password hash, profile image, delivery address, GPS coordinates when you allow location access, order history, cart and wishlist activity, payment references, support messages, reviews, device details, IP address, session records, and communication preferences.',
  },
  {
    title: '3. Profile Images And Uploaded Files',
    body: 'When you upload a profile image, the file is stored by our configured image service or on our server uploads storage. The image may be displayed in your account, navigation menu, support messages, reviews, admin tools, and other account-related areas. Do not upload images that you do not have permission to use.',
  },
  {
    title: '4. Location And Maps',
    body: 'If you allow browser location access, we use coordinates to help confirm delivery drop-off points and improve delivery accuracy. If you deny permission, you can manually enter your address and use a map preview. Map providers may process map requests according to their own terms and privacy policies.',
  },
  {
    title: '5. How We Use Information',
    body: 'We use personal information to create and secure accounts, process orders, validate stock, request payments, deliver products, provide order tracking, send notifications, respond to messages, prevent fraud, improve performance, personalize the experience, maintain records, and comply with legal or operational obligations.',
  },
  {
    title: '6. Communications',
    body: 'We may contact you through in-app notifications, email, phone, SMS, WhatsApp, or support chat about account activity, order status, payment updates, delivery coordination, security alerts, service changes, promotions where allowed, and responses to your enquiries.',
  },
  {
    title: '7. Sharing With Service Providers',
    body: 'We may share necessary data with service providers such as payment processors, M-PESA integrations, delivery teams, hosting providers, email/SMS/WhatsApp gateways, image storage providers, analytics tools, security tools, and map providers. They should only process information needed to provide their services.',
  },
  {
    title: '8. Security And Retention',
    body: 'We use reasonable technical and organizational safeguards, including authentication, password hashing, session management, access controls, and operational monitoring. No system is perfectly secure. We retain information for as long as needed for orders, support, legal, tax, audit, fraud prevention, and service operations.',
  },
  {
    title: '9. Cookies, Sessions, And Local Storage',
    body: 'The website may use cookies, browser storage, guest session IDs, authentication tokens, language preferences, cart state, and similar technologies to keep you signed in, preserve cart activity, remember preferences, secure sessions, and improve responsiveness.',
  },
  {
    title: '10. Your Choices And Rights',
    body: 'You can update profile information, change password, manage some communication settings, request support, and ask us to review, correct, or delete information where legally and operationally possible. Some records may be retained where required for completed orders, compliance, security, or dispute resolution.',
  },
  {
    title: '11. Children',
    body: 'The website is intended for users who can legally make purchases or who use the service with appropriate permission. We do not knowingly create buyer accounts for children without appropriate consent.',
  },
  {
    title: '12. Updates To This Policy',
    body: 'We may update this Privacy Policy as the website, business, integrations, or legal requirements change. The updated date on this page shows the latest version. Continued use of the website after updates means you accept the updated policy.',
  },
  {
    title: '13. Contact',
    body: 'For privacy questions, account concerns, data requests, or security reports, contact Hincton Meat Products through the contact page, listed phone number, or listed email address.',
  },
]

const LegalPage = ({ type }: LegalPageProps) => {
  const isTerms = type === 'terms'
  const title = isTerms ? 'Terms And Conditions' : 'Privacy Policy'
  const sections = isTerms ? termsSections : privacySections

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">{HINCTON_BRAND.name}</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-gray-300">Last updated: {updatedDate}</p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-base leading-8 text-gray-700">
            These terms are written for customers using the Hincton Meat Products website, buyer account, checkout,
            delivery tracking, messaging, and related services. Read the full page before creating an account or placing an order.
          </p>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-extrabold text-gray-950">{section.title}</h2>
                <p className="mt-3 leading-8 text-gray-700">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-gray-200 pt-6">
            <Link to="/register" className="rounded-md bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800">
              Back To Signup
            </Link>
            <Link to="/contact" className="rounded-md border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50">
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LegalPage
