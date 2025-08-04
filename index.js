const { exec } = require('child_process');
const path = require("path")
const express = require("express")
const fs = require('fs');
const MarkdownIt = require('markdown-it');
const fm = require('front-matter');
const app = express()

const md = new MarkdownIt();

app.use(express.static(path.join(__dirname, "public")))
app.use('/blog-assets', express.static(path.join(__dirname, 'public/blog-assets')))

app.get("/", (req,res) => {
  exec('npx tailwindcss -i ./input.css -o ./public/out.css', (err, stdout, stderr) => {
    if (err) {
      console.error('Error building CSS:', err);
      return;
    }
  });
  res.sendFile(path.join(__dirname, "public/index.html"))
})

// Helper function to read all blog posts
function getAllPosts() {
  const postsDir = path.join(__dirname, 'blog-posts');

  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

  return files.map(file => {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Clean up the content - remove any leading/trailing whitespace
    const cleanContent = content.trim();

    // Parse frontmatter
    const parsed = fm(cleanContent);

    // Extract first image from markdown content
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
    const imageMatch = parsed.body.match(imageRegex);
    let keyImage = null;
    let keyImageAlt = null;

    if (imageMatch) {
      keyImageAlt = imageMatch[1] || 'Blog post image';
      keyImage = imageMatch[2];
      
      // Handle relative paths - prepend /blog-assets/ if the path doesn't start with http or /
      if (keyImage && !keyImage.startsWith('http') && !keyImage.startsWith('/')) {
        keyImage = `/blog-assets/${keyImage}`;
      }
    }

    // Create clean excerpt from body if no excerpt in frontmatter
    const bodyText = parsed.body.replace(/^#.*$/gm, '').replace(/\n+/g, ' ').trim();
    const cleanExcerpt = parsed.attributes.excerpt || bodyText.substring(0, 200) + '...';

    const post = {
      title: parsed.attributes.title || 'Untitled',
      slug: parsed.attributes.slug || file.replace('.md', ''),
      date: parsed.attributes.date || new Date().toISOString(),
      category: parsed.attributes.category || 'General',
      tags: parsed.attributes.tags || [],
      excerpt: cleanExcerpt,
      content: parsed.body,
      filename: file,
      keyImage: keyImage,
      keyImageAlt: keyImageAlt
    };

    return post;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Helper function to get related posts
function getRelatedPosts(currentPost, allPosts, limit = 3) {
  if (!currentPost.tags) return [];

  return allPosts
    .filter(post => post.slug !== currentPost.slug)
    .filter(post => post.tags && post.tags.some(tag => currentPost.tags.includes(tag)))
    .slice(0, limit);
}

// Blog index route
app.get("/blog", (req, res) => {
  const posts = getAllPosts();
  const categories = [...new Set(posts.map(post => post.category))];
  const selectedCategory = req.query.category;

  const filteredPosts = selectedCategory 
    ? posts.filter(post => post.category === selectedCategory)
    : posts;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - RO-bot AI Co-Pilot</title>
    <meta name="description" content="Stay updated with the latest in automotive technology, AI diagnostics, and repair efficiency with RO-bot's blog.">
    <link rel="stylesheet" href="/out.css">
    <link rel="stylesheet" href="/shared-nav.css">
    <link rel="stylesheet" href="/nav-styles.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Montserrat:wght@400;500;600;700;800&display=swap');

        body {
            font-family: 'Roboto', sans-serif;
            line-height: 1.6;
            color: #0F1108;
            background: #ffffff;
        }

        /* Brand colors for navigation buttons */
        .bg-brand-orange {
            background-color: #C63006;
        }

        .hover\:bg-white:hover {
            background-color: white;
        }

        .hover\:text-brand-orange:hover {
            color: #C63006;
        }

        .border-brand-orange {
            border-color: #C63006;
        }

        .bg-brand-green {
            background-color: #2A9D8F;
        }

        .hover\:text-brand-green:hover {
            color: #2A9D8F;
        }

        .border-brand-green {
            border-color: #2A9D8F;
        }



        /* Hero section with gradient matching main site */
        .hero-section {
            background: linear-gradient(135deg, #2A9D8F 0%, #1a7a6e 50%, #0F1108 100%);
            position: relative;
            overflow: hidden;
        }

        .hero-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.1);
            z-index: 1;
        }

        .hero-content {
            position: relative;
            z-index: 2;
            text-align: center;
            padding: 4rem 0;
        }

        .hero-title {
            font-family: 'Montserrat', sans-serif;
            font-weight: 800;
            font-size: 4rem;
            color: white;
            margin-bottom: 1.5rem;
            letter-spacing: -0.02em;
            line-height: 1.1;
        }

        .hero-subtitle {
            font-size: 1.5rem;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 300;
            margin-bottom: 0;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }

        /* Main content section */
        .content-section {
            background: #f8faf9;
            min-height: 100vh;
            padding: 4rem 0;
        }

        /* Blog grid */
        .blog-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2.5rem;
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        @media (max-width: 768px) {
            .blog-grid {
                grid-template-columns: 1fr;
                gap: 2rem;
                padding: 0 1rem;
            }
        }

        /* Blog card link wrapper */
        .blog-card-link {
            text-decoration: none;
            color: inherit;
            display: block;
            transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .blog-card-link:focus {
            outline: 3px solid rgba(42, 157, 143, 0.5);
            outline-offset: 4px;
            border-radius: 20px;
        }

        /* Blog cards matching main site aesthetic */
        .blog-card {
            background: white;
            border-radius: 20px;
            padding: 0;
            box-shadow: 0 8px 40px rgba(15, 17, 8, 0.08);
            border: 1px solid rgba(42, 157, 143, 0.05);
            transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            height: fit-content;
            cursor: pointer;
        }

        .blog-card-link:hover .blog-card {
            transform: translateY(-12px);
            box-shadow: 0 25px 70px rgba(15, 17, 8, 0.18);
            border-color: rgba(42, 157, 143, 0.25);
        }

        /* Card image styling */
        .card-image {
            width: 100%;
            aspect-ratio: 16/9;
            overflow: hidden;
            border-radius: 20px 20px 0 0;
        }

        .card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .blog-card-link:hover .card-image img {
            transform: scale(1.08);
        }

        /* Card content container */
        .card-content {
            padding: 2.5rem;
        }

        /* Card header */
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .category-badge {
            display: inline-flex;
            align-items: center;
            padding: 0;
            border-radius: 0;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #9CA3AF;
            background: none;
            transition: all 0.3s ease;
        }

        .category-technology,
        .category-business,
        .category-innovation,
        .category-general {
            color: #9CA3AF;
            background: none;
        }

        .post-date {
            font-size: 0.9rem;
            color: #666;
            font-weight: 500;
        }

        /* Card content */
        .card-title {
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 1.75rem;
            color: #0F1108;
            margin-bottom: 1rem;
            line-height: 1.3;
            transition: color 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .blog-card-link:hover .card-title {
            color: #2A9D8F;
        }

        .card-excerpt {
            color: #4a5568;
            font-size: 1.1rem;
            line-height: 1.7;
            margin-bottom: 1.5rem;
        }

        /* Tags */
        .tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 2rem;
        }

        .tag-pill {
            background: rgba(42, 157, 143, 0.1);
            color: #0F1108;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            border: 1px solid rgba(42, 157, 143, 0.2);
            transition: all 0.2s ease;
        }

        .tag-pill:hover {
            background: rgba(42, 157, 143, 0.2);
            transform: translateY(-1px);
        }

        /* Read more button */
        .read-more-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            background: linear-gradient(135deg, #2A9D8F, #1a7a6e);
            color: white;
            padding: 0.875rem 2rem;
            border-radius: 30px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(42, 157, 143, 0.3);
            pointer-events: none;
        }

        .blog-card-link:hover .read-more-btn {
            transform: translateX(4px);
            box-shadow: 0 6px 30px rgba(42, 157, 143, 0.4);
        }

        .read-more-btn svg {
            transition: transform 0.3s ease;
        }

        .blog-card-link:hover .read-more-btn svg {
            transform: translateX(3px);
        }

        /* Empty state */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: #6c757d;
        }

        .empty-state .icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            opacity: 0.5;
        }

        .empty-state h3 {
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 1.75rem;
            color: #0F1108;
            margin-bottom: 0.75rem;
        }

        .empty-state p {
            font-size: 1.1rem;
            color: #6c757d;
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2.5rem;
            }

            .hero-subtitle {
                font-size: 1.2rem;
            }

            .hero-content {
                padding: 4rem 0;
            }

            .card-content {
                padding: 2rem;
            }

            .card-title {
                font-size: 1.5rem;
            }

            .card-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.75rem;
            }
        }

        @media (max-width: 480px) {
            .filter-select {
                min-width: 200px;
            }

            .card-content {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <div id="navigation-placeholder"></div>
    <!-- Alpine MUST load first -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <!-- Then load navigation after Alpine -->
    <script src="/nav-loader.js"></script>

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-content">
            <h1 class="hero-title">
                Wrench Time Reports
            </h1>
            <p class="hero-subtitle">
                Fueling fixed‑ops success, one RO at a time.
            </p>
        </div>
    </section>

    <!-- Main Content -->
    <section class="content-section">
        <div class="max-w-7xl mx-auto">
            <!-- Blog Grid -->
            ${filteredPosts.length > 0 ? `
                <div class="blog-grid">
                    ${filteredPosts.map(post => `
                        <a href="/blog/${post.slug}" class="blog-card-link">
                            <article class="blog-card">
                                ${post.keyImage ? `
                                    <div class="card-image">
                                        <img src="${post.keyImage}" alt="${post.keyImageAlt}" loading="lazy" decoding="async">
                                    </div>
                                ` : ''}
                                
                                <div class="card-content">
                                    <div class="card-header">
                                        <span class="category-badge category-${post.category.toLowerCase()}">${post.category}</span>
                                        <time class="post-date">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                                    </div>

                                    <h2 class="card-title">${post.title}</h2>

                                    <p class="card-excerpt">${post.excerpt}</p>
                                </div>
                            </article>
                        </a>
                    `).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <div class="icon">📝</div>
                    <h3>No articles found</h3>
                    <p>Try selecting a different category to see more content.</p>
                </div>
            `}
        </div>
    </section>

    
</body>
</html>
  `;

  res.send(html);
});

// Individual blog post route
app.get("/blog/:slug", (req, res) => {
  const posts = getAllPosts();
  const post = posts.find(p => p.slug === req.params.slug);

  if (!post) {
    return res.status(404).send('Post not found');
  }

  const relatedPosts = getRelatedPosts(post, posts);
  const renderedContent = md.render(post.content);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - RO-bot Blog</title>
    <meta name="description" content="${post.excerpt}">
    <link rel="stylesheet" href="/out.css">
    <link rel="stylesheet" href="/shared-nav.css">
    <link rel="stylesheet" href="/nav-styles.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Montserrat:wght@400;500;600;700;800&display=swap');

        /* Brand colors for navigation buttons */
        .bg-brand-orange {
            background-color: #C63006;
        }

        .hover\:bg-white:hover {
            background-color: white;
        }

        .hover\:text-brand-orange:hover {
            color: #C63006;
        }

        .border-brand-orange {
            border-color: #C63006;
        }

        .bg-brand-green {
            background-color: #2A9D8F;
        }

        .hover\:text-brand-green:hover {
            color: #2A9D8F;
        }

        .border-brand-green {
            border-color: #2A9D8F;
        }

        .prose {
            max-width: none;
            color: #374151;
            line-height: 1.75;
        }

        .prose img {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            margin: 2.5rem 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .prose h1 {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 3rem 0 1.5rem 0;
            color: #264653;
            font-family: 'Montserrat';
            line-height: 1.2;
        }

        .prose h2 {
            font-size: 2rem;
            font-weight: 700;
            margin: 2.5rem 0 1rem 0;
            color: #264653;
            font-family: 'Montserrat';
            position: relative;
            padding-bottom: 0.5rem;
        }

        .prose h2::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #2a9d8f, #20b2aa);
            border-radius: 2px;
        }

        .prose h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 2rem 0 0.75rem 0;
            color: #2a9d8f;
            font-family: 'Montserrat';
        }

        .prose p {
            margin: 1.5rem 0;
            line-height: 1.8;
            color: #4a5568;
            font-size: 1.1rem;
        }

        .prose ul, .prose ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
        }

        .prose li {
            margin: 0.75rem 0;
            line-height: 1.7;
        }

        .prose a {
            color: #2a9d8f;
            text-decoration: none;
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
        }

        .prose a:hover {
            color: #264653;
            border-bottom-color: #2a9d8f;
        }

        .prose blockquote {
            border-left: 4px solid #2a9d8f;
            background: rgba(42, 157, 143, 0.05);
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }

        .prose code {
            background: rgba(42, 157, 143, 0.1);
            color: #264653;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9em;
        }

        .category-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .category-technology {
            background: linear-gradient(135deg, #2a9d8f, #20b2aa);
            color: white;
            box-shadow: 0 4px 15px rgba(42, 157, 143, 0.3);
        }

        .category-business {
            background: linear-gradient(135deg, #264653, #2a9d8f);
            color: white;
            box-shadow: 0 4px 15px rgba(38, 70, 83, 0.3);
        }

        .category-innovation {
            background: linear-gradient(135deg, #f4a261, #e76f51);
            color: white;
            box-shadow: 0 4px 15px rgba(244, 162, 97, 0.3);
        }

        .category-general {
            background: linear-gradient(135deg, #6c757d, #495057);
            color: white;
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }

        .tag-pill {
            background: rgba(42, 157, 143, 0.1);
            color: #264653;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            border: 1px solid rgba(42, 157, 143, 0.2);
        }

        .related-card {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(42, 157, 143, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .related-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #2a9d8f, #264653);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .related-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(42, 157, 143, 0.15);
            border-color: rgba(42, 157, 143, 0.3);
        }

        .related-card:hover::before {
            opacity: 1;
        }
    </style>
</head>
<body class="font-sans" style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5f3 100%); min-height: 100vh;">
    <!-- Navigation -->
    <div id="navigation-placeholder"></div>
    <!-- Alpine MUST load first -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <!-- Then load navigation after Alpine -->
    <script src="/nav-loader.js"></script>

    <!-- Breadcrumb -->
    <div class="py-8" style="margin-top: 20px; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav class="text-sm font-medium">
                <a href="/" class="text-gray-500 hover:text-brand-green transition-colors">Home</a>
                <span class="mx-2 text-gray-400">/</span>
                <a href="/blog" class="text-gray-500 hover:text-brand-green transition-colors">Blog</a>
                <span class="mx-2 text-gray-400">/</span>
                <span class="text-brand-dark truncate">${post.title}</span>
            </nav>
        </div>
    </div>

    <!-- Article -->
    <article class="py-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Article Header -->
            <header class="mb-12">
                <div class="flex items-center justify-between mb-6">
                    <span class="category-badge category-${post.category.toLowerCase()}">${post.category}</span>
                    <time class="text-gray-500 font-medium">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                </div>

                <h1 class="font-montserrat font-bold text-4xl sm:text-5xl lg:text-6xl text-brand-dark mb-6 leading-tight">${post.title}</h1>

                <p class="text-xl sm:text-2xl text-gray-600 leading-relaxed mb-6 font-light">${post.excerpt}</p>

                ${post.tags && post.tags.length > 0 ? `
                    <div class="flex flex-wrap gap-3">
                        ${post.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </header>

            <!-- Article Content -->
            <div class="prose">
                ${renderedContent}
            </div>
        </div>
    </article>

    <!-- Related Posts -->
    ${relatedPosts.length > 0 ? `
    <section class="py-20" style="background: rgba(42, 157, 143, 0.03);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="font-montserrat font-bold text-3xl mb-12 text-center text-brand-dark">Related Articles</h2>
            <div class="grid md:grid-cols-3 gap-8">
                ${relatedPosts.map(relPost => `
                    <article class="related-card">
                        <span class="category-badge category-${relPost.category.toLowerCase()} mb-4">${relPost.category}</span>
                        <h3 class="font-montserrat font-bold text-xl mb-3 leading-tight">
                            <a href="/blog/${relPost.slug}" class="text-brand-dark hover:text-brand-green transition-colors">${relPost.title}</a>
                        </h3>
                        <p class="text-gray-600 text-sm mb-4 leading-relaxed">${relPost.excerpt}</p>
                        <a href="/blog/${relPost.slug}" class="text-brand-green font-semibold hover:text-brand-dark transition-colors text-sm inline-flex items-center gap-2">
                            Read Article
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </a>
                    </article>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Back to Blog -->
    <div class="pt-16 pb-12 text-center">
        <a href="/blog" class="inline-flex flex-col items-center gap-4 transition-all duration-300 hover:transform hover:scale-105">
            <img src="/RObot logos/head only.png" alt="RO-bot Logo" style="width: 1.5rem; height: 1.5rem; object-fit: contain; margin: 0 auto;" class="flex-shrink-0">
            <span class="text-gray-700 font-semibold text-lg">All Articles</span>
        </a>
    </div>
</body>
</html>
  `;

  res.send(html);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})