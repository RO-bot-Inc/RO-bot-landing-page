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
  console.log('Posts directory:', postsDir);
  
  if (!fs.existsSync(postsDir)) {
    console.log('Posts directory does not exist');
    return [];
  }
  
  const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
  console.log('Found markdown files:', files);
  
  return files.map(file => {
    const filePath = path.join(postsDir, file);
    console.log('Reading file:', filePath);
    
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('Raw content length:', content.length);
    console.log('First 200 chars:', content.substring(0, 200));
    
    const parsed = fm(content);
    console.log('Parsed attributes:', parsed.attributes);
    console.log('Parsed body length:', parsed.body.length);
    
    const post = {
      title: parsed.attributes.title || 'Untitled',
      slug: parsed.attributes.slug || file.replace('.md', ''),
      date: parsed.attributes.date || new Date().toISOString(),
      category: parsed.attributes.category || 'General',
      tags: parsed.attributes.tags || [],
      excerpt: parsed.attributes.excerpt || parsed.body.substring(0, 200) + '...',
      content: parsed.body,
      filename: file
    };
    
    console.log('Final post object:', {
      title: post.title,
      slug: post.slug,
      date: post.date,
      category: post.category,
      tags: post.tags,
      excerpt: post.excerpt
    });
    
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
  console.log('=== Blog Index Route ===');
  const posts = getAllPosts();
  console.log('Number of posts loaded:', posts.length);
  
  const categories = [...new Set(posts.map(post => post.category))];
  console.log('Categories found:', categories);
  
  const selectedCategory = req.query.category;
  console.log('Selected category:', selectedCategory);
  
  const filteredPosts = selectedCategory 
    ? posts.filter(post => post.category === selectedCategory)
    : posts;
    
  console.log('Filtered posts count:', filteredPosts.length);
  if (filteredPosts.length > 0) {
    console.log('First filtered post:', {
      title: filteredPosts[0].title,
      slug: filteredPosts[0].slug,
      date: filteredPosts[0].date,
      category: filteredPosts[0].category
    });
  }

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
        
        /* Blog-specific styles matching main site aesthetic */
        .blog-card {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(42, 157, 143, 0.1);
            border-radius: 16px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .blog-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px rgba(42, 157, 143, 0.15);
            border-color: rgba(42, 157, 143, 0.3);
        }
        
        .blog-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #2a9d8f, #264653);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .blog-card:hover::before {
            opacity: 1;
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
            transition: all 0.2s ease;
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
        
        .filter-select {
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid rgba(42, 157, 143, 0.2);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            font-weight: 500;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        
        .filter-select:focus {
            outline: none;
            border-color: #2a9d8f;
            box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.1);
        }
        
        .tag-pill {
            background: rgba(42, 157, 143, 0.1);
            color: #264653;
            padding: 0.25rem 0.75rem;
            border-radius: 16px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid rgba(42, 157, 143, 0.2);
            transition: all 0.2s ease;
        }
        
        .tag-pill:hover {
            background: rgba(42, 157, 143, 0.2);
            border-color: rgba(42, 157, 143, 0.4);
        }
        
        .read-more-btn {
            background: linear-gradient(135deg, #2a9d8f, #20b2aa);
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            font-size: 0.875rem;
        }
        
        .read-more-btn:hover {
            transform: translateX(5px);
            box-shadow: 0 8px 25px rgba(42, 157, 143, 0.3);
            text-decoration: none;
            color: white;
        }
    </style>
</head>
<body class="font-sans" style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5f3 100%); min-height: 100vh;">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <img src="/RObot logos/generated-icon.png" alt="RO-bot" class="h-10 w-10 mr-3">
                    <span class="font-montserrat font-bold text-2xl text-brand-dark">RO-bot</span>
                </div>
                <nav class="hidden md:flex space-x-8">
                    <a href="/" class="text-brand-dark hover:text-brand-green transition-colors font-medium">Home</a>
                    <a href="/blog" class="text-brand-green font-semibold border-b-2 border-brand-green pb-1">Blog</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="py-20" style="background: linear-gradient(135deg, #2a9d8f 0%, #264653 100%);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="font-montserrat font-bold text-5xl sm:text-6xl lg:text-7xl text-white mb-6 tracking-tight">
                RO-bot <span style="background: linear-gradient(45deg, #f4a261, #e76f51); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Insights</span>
            </h1>
            <p class="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
                Stay ahead with the latest in automotive technology, AI diagnostics, and repair efficiency insights from industry experts.
            </p>
        </div>
    </section>

    <!-- Blog Content -->
    <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Category Filter -->
            <div class="mb-12 text-center">
                <label for="category-filter" class="block text-lg font-semibold text-brand-dark mb-4 font-montserrat">Explore by Category</label>
                <select id="category-filter" onchange="filterByCategory(this.value)" class="filter-select">
                    <option value="">All Categories</option>
                    ${categories.map(cat => `<option value="${cat}" ${selectedCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>

            <!-- Posts Grid -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                ${filteredPosts.map(post => `
                    <article class="blog-card group">
                        <div class="flex items-center justify-between mb-6">
                            <span class="category-badge category-${post.category.toLowerCase()}">${post.category}</span>
                            <time class="text-sm text-gray-500 font-medium">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                        </div>
                        
                        <h2 class="font-montserrat font-bold text-2xl mb-4 text-brand-dark leading-tight">
                            <a href="/blog/${post.slug}" class="hover:text-brand-green transition-colors">${post.title}</a>
                        </h2>
                        
                        <p class="text-gray-600 mb-6 leading-relaxed text-base">${post.excerpt}</p>
                        
                        ${post.tags && post.tags.length > 0 ? `
                            <div class="flex flex-wrap gap-2 mb-6">
                                ${post.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        <a href="/blog/${post.slug}" class="read-more-btn">
                            Read Article
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </a>
                    </article>
                `).join('')}
            </div>
            
            ${filteredPosts.length === 0 ? `
                <div class="text-center py-16">
                    <div class="text-gray-400 text-6xl mb-4">📝</div>
                    <h3 class="font-montserrat font-semibold text-2xl text-gray-600 mb-2">No posts found</h3>
                    <p class="text-gray-500">Try adjusting your category filter.</p>
                </div>
            ` : ''}
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
  console.log('=== Individual Post Route ===');
  console.log('Requested slug:', req.params.slug);
  
  const posts = getAllPosts();
  console.log('Available slugs:', posts.map(p => p.slug));
  
  const post = posts.find(p => p.slug === req.params.slug);
  console.log('Found post:', post ? post.title : 'NOT FOUND');
  
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
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <img src="/RObot logos/generated-icon.png" alt="RO-bot" class="h-10 w-10 mr-3">
                    <span class="font-montserrat font-bold text-2xl text-brand-dark">RO-bot</span>
                </div>
                <nav class="hidden md:flex space-x-8">
                    <a href="/" class="text-brand-dark hover:text-brand-green transition-colors font-medium">Home</a>
                    <a href="/blog" class="text-brand-green font-semibold border-b-2 border-brand-green pb-1">Blog</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Breadcrumb -->
    <div class="py-6" style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);">
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
    <div class="py-12 text-center">
        <a href="/blog" class="inline-flex items-center gap-3 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:transform hover:scale-105" style="background: linear-gradient(135deg, #2a9d8f, #264653); box-shadow: 0 8px 25px rgba(42, 157, 143, 0.3);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to All Articles
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
