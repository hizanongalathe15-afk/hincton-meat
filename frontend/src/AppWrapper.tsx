import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { AuthProvider } from './contexts/AuthContext'
import PictureInPictureProvider from './components/PictureInPictureProvider'
import App from './App'

const AppWrapper = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <PictureInPictureProvider>
            <App />
          </PictureInPictureProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default AppWrapper
