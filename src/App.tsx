import { Route, Routes } from 'react-router'
import Blog from './pages/Blog.tsx'
import Article from './pages/Article.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Blog />} />
      <Route path={'/:year/:slug'} element={<Article />} />
    </Routes>
  )
}

export default App
