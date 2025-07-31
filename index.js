const { exec } = require('child_process');
const path = require("path")
const express = require("express")
const fs = require('fs');
const MarkdownIt = require('markdown-it');
const fm = require('front-matter');
const app = express()

const md = new MarkdownIt();

app.use(express.static(path.join(__dirname, "public")))

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
    const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const parsed = fm(content);
    return {
      ...parsed.attributes,
      content: parsed.body,
      filename: file
    };
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
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Montserrat:wght@400;500;600;700;800&display=swap');
    </style>
</head>
<body class="font-sans bg-white">
    <!-- Header (simplified for blog) -->
    <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <img src="/RObot logos/generated-icon.png" alt="RO-bot" class="h-8 w-8 mr-3">
                    <span class="font-montserrat font-bold text-xl text-brand-dark">RO-bot</span>
                </div>
                <nav class="hidden md:flex space-x-8">
                    <a href="/" class="text-brand-dark hover:text-brand-orange transition-colors">Home</a>
                    <a href="/blog" class="text-brand-orange font-medium">Blog</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Blog Header -->
    <section class="bg-brand-dark text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="font-montserrat font-bold text-4xl sm:text-5xl lg:text-6xl mb-4">RO-bot Blog</h1>
            <p class="text-xl opacity-90 max-w-2xl mx-auto">Stay updated with the latest in automotive technology, AI diagnostics, and repair efficiency.</p>
        </div>
    </section>

    <!-- Blog Content -->
    <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Category Filter -->
            <div class="mb-8">
                <label for="category-filter" class="block text-sm font-medium text-brand-dark mb-2">Filter by Category:</label>
                <select id="category-filter" onchange="filterByCategory(this.value)" class="border border-gray-300 rounded-md px-3 py-2">
                    <option value="">All Categories</option>
                    ${categories.map(cat => `<option value="${cat}" ${selectedCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>

            <!-- Posts Grid -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${filteredPosts.map(post => `
                    <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div class="p-6">
                            <div class="flex items-center justify-between mb-3">
                                <span class="inline-block bg-brand-orange text-white text-xs px-2 py-1 rounded-full">${post.category}</span>
                                <time class="text-sm text-brand-light">${new Date(post.date).toLocaleDateString()}</time>
                            </div>
                            <h2 class="font-montserrat font-bold text-xl mb-3">
                                <a href="/blog/${post.slug}" class="text-brand-dark hover:text-brand-orange transition-colors">${post.title}</a>
                            </h2>
                            <p class="text-brand-light mb-4">${post.excerpt}</p>
                            <div class="flex flex-wrap gap-2 mb-4">
                                ${post.tags ? post.tags.map(tag => `<span class="text-xs bg-gray-100 text-brand-dark px-2 py-1 rounded">${tag}</span>`).join('') : ''}
                            </div>
                            <a href="/blog/${post.slug}" class="text-brand-orange font-medium hover:underline">Read More →</a>
                        </div>
                    </article>
                `).join('')}
            </div>
        </div>
    </section>

    <script>
        function filterByCategory(category) {
            const url = new URL(window.location);
            if (category) {
                url.searchParams.set('category', category);
            } else {
                url.searchParams.delete('category');
            }
            window.location.href = url.toString();
        }
    </script>
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
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Montserrat:wght@400;500;600;700;800&display=swap');
        .prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; }
        .prose h2 { font-size: 1.875rem; font-weight: 700; margin: 2rem 0 1rem 0; color: #0F1108; }
        .prose h3 { font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; color: #0F1108; }
        .prose p { margin: 1rem 0; line-height: 1.75; color: #374151; }
        .prose ul { margin: 1rem 0; padding-left: 1.5rem; }
        .prose li { margin: 0.5rem 0; }
        .prose a { color: #C63006; text-decoration: underline; }
        .prose a:hover { color: #2A9D8F; }
    </style>
</head>
<body class="font-sans bg-white">
    <!-- Header -->
    <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <img src="/RObot logos/generated-icon.png" alt="RO-bot" class="h-8 w-8 mr-3">
                    <span class="font-montserrat font-bold text-xl text-brand-dark">RO-bot</span>
                </div>
                <nav class="hidden md:flex space-x-8">
                    <a href="/" class="text-brand-dark hover:text-brand-orange transition-colors">Home</a>
                    <a href="/blog" class="text-brand-orange font-medium">Blog</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Breadcrumb -->
    <div class="bg-gray-50 py-4">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav class="text-sm">
                <a href="/" class="text-brand-light hover:text-brand-orange">Home</a>
                <span class="mx-2 text-brand-light">/</span>
                <a href="/blog" class="text-brand-light hover:text-brand-orange">Blog</a>
                <span class="mx-2 text-brand-light">/</span>
                <span class="text-brand-dark">${post.title}</span>
            </nav>
        </div>
    </div>

    <!-- Article -->
    <article class="py-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Article Header -->
            <header class="mb-8">
                <div class="flex items-center justify-between mb-4">
                    <span class="inline-block bg-brand-orange text-white text-sm px-3 py-1 rounded-full">${post.category}</span>
                    <time class="text-brand-light">${new Date(post.date).toLocaleDateString()}</time>
                </div>
                <h1 class="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-brand-dark mb-4">${post.title}</h1>
                <p class="text-xl text-brand-light leading-relaxed">${post.excerpt}</p>
                <div class="flex flex-wrap gap-2 mt-4">
                    ${post.tags ? post.tags.map(tag => `<span class="text-sm bg-gray-100 text-brand-dark px-3 py-1 rounded">${tag}</span>`).join('') : ''}
                </div>
            </header>

            <!-- Article Content -->
            <div class="prose max-w-none">
                ${renderedContent}
            </div>
        </div>
    </article>

    <!-- Related Posts -->
    ${relatedPosts.length > 0 ? `
    <section class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="font-montserrat font-bold text-2xl mb-8 text-center">Related Posts</h2>
            <div class="grid md:grid-cols-3 gap-8">
                ${relatedPosts.map(relPost => `
                    <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div class="p-6">
                            <span class="inline-block bg-brand-orange text-white text-xs px-2 py-1 rounded-full mb-3">${relPost.category}</span>
                            <h3 class="font-montserrat font-bold text-lg mb-3">
                                <a href="/blog/${relPost.slug}" class="text-brand-dark hover:text-brand-orange transition-colors">${relPost.title}</a>
                            </h3>
                            <p class="text-brand-light text-sm mb-4">${relPost.excerpt}</p>
                            <a href="/blog/${relPost.slug}" class="text-brand-orange font-medium hover:underline text-sm">Read More →</a>
                        </div>
                    </article>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Back to Blog -->
    <div class="py-8 text-center">
        <a href="/blog" class="inline-block bg-brand-orange text-white hover:bg-opacity-90 font-semibold px-6 py-3 rounded-lg transition duration-150 ease-in-out">
            ← Back to Blog
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
