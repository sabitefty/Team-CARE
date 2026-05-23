// ═══════════════════════════════════════════════════
//  Team C.A.R.E — Dynamic Content Renderer
//  File: src/utils/renderer.js
//  Fetches Firebase data and injects into existing HTML
// ═══════════════════════════════════════════════════

import { Projects, TeamMembers, Achievements, Gallery, News, SiteSettings, HeroContent, ContactMessages } from '../firebase/db.js';

// ═══════════════════════════════════════
//  HERO SECTION
// ═══════════════════════════════════════
export async function renderHero() {
  try {
    const data = await HeroContent.get();
    if (!data) return; // keep static HTML if no Firebase data

    if (data.eyebrow)       document.querySelector('.hero-eyebrow').textContent = data.eyebrow;
    if (data.titleLine1)    document.querySelector('.hero-title-line1').textContent = data.titleLine1;
    if (data.titleAccent)   document.querySelector('.hero-title-accent').textContent = data.titleAccent;
    if (data.description)   document.querySelector('.hero-desc').innerHTML = data.description;
    if (data.primaryBtnText) document.querySelector('.btn-primary').textContent = data.primaryBtnText;
  } catch (e) {
    console.warn('Hero render failed, using static content');
  }
}

// ═══════════════════════════════════════
//  PROJECTS SECTION
// ═══════════════════════════════════════
export async function renderProjects() {
  const container = document.querySelector('.projects-grid, [data-section="projects"]');
  if (!container) return;

  try {
    const projects = await Projects.getAll(true);
    if (!projects.length) return;

    container.innerHTML = projects.map(p => `
      <div class="project-card fade-up" data-id="${p.id}">
        <div class="project-thumb" style="${p.imageUrl ? `background-image:url(${p.imageUrl})` : ''}">
          ${!p.imageUrl ? `<span class="project-thumb-emoji">${p.emoji || '⚡'}</span>` : ''}
          ${p.featured ? '<span class="project-badge">Featured</span>' : ''}
        </div>
        <div class="project-body">
          <div class="project-category">${p.category || 'Research'}</div>
          <h3>${p.title}</h3>
          <p>${p.shortDesc}</p>
          <div class="project-tags">
            ${(p.tags || []).map(t => `<span class="project-tag">${t}</span>`).join('')}
          </div>
          <div class="project-footer">
            <span class="project-year">${p.year || new Date().getFullYear()}</span>
            <button class="project-more" onclick="openPage('projects')">View →</button>
          </div>
        </div>
      </div>
    `).join('');

    // Re-trigger scroll animations for new elements
    document.querySelectorAll('.project-card.fade-up').forEach(el => {
      window._careObserver?.observe(el);
    });
  } catch (e) {
    console.warn('Projects render failed:', e.message);
  }
}

// ═══════════════════════════════════════
//  TEAM SECTION
// ═══════════════════════════════════════
export async function renderTeam() {
  const container = document.querySelector('.team-grid, [data-section="team"]');
  if (!container) return;

  try {
    const members = await TeamMembers.getAll(true);
    if (!members.length) return;

    container.innerHTML = members.map(m => `
      <div class="member-card fade-up" style="--delay:${members.indexOf(m) * 0.06}s">
        <div class="member-avatar">
          ${m.photoUrl
            ? `<img src="${m.photoUrl}" alt="${m.name}" loading="lazy">`
            : `<div class="avatar-initials">${m.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>`
          }
        </div>
        <div class="member-info">
          <h4>${m.name}</h4>
          <span class="role">${m.role}</span>
          ${m.department ? `<span class="dept">${m.department}</span>` : ''}
          <div class="member-links">
            ${m.linkedin ? `<a href="${m.linkedin}" target="_blank" rel="noopener" class="member-link">in</a>` : ''}
            ${m.github   ? `<a href="${m.github}"   target="_blank" rel="noopener" class="member-link">gh</a>` : ''}
            ${m.email    ? `<a href="mailto:${m.email}" class="member-link">✉</a>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('Team render failed:', e.message);
  }
}

// ═══════════════════════════════════════
//  ACHIEVEMENTS SECTION
// ═══════════════════════════════════════
export async function renderAchievements() {
  const container = document.querySelector('.achievements-list, [data-section="achievements"]');
  if (!container) return;

  try {
    const items = await Achievements.getAll(true);
    if (!items.length) return;

    container.innerHTML = items.map((a, i) => `
      <div class="achieve-card fade-up">
        <div class="achieve-thumb">${a.emoji || '🏆'}</div>
        <div class="achieve-body">
          <div class="achieve-meta">
            <span class="achieve-year">${a.year}</span>
            ${a.level ? `<span class="achieve-level level-${a.level}">${a.level}</span>` : ''}
          </div>
          <h3>${a.title}</h3>
          <p>${a.description}</p>
          ${a.organizer ? `<div class="achieve-org">${a.organizer}</div>` : ''}
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('Achievements render failed:', e.message);
  }
}

// ═══════════════════════════════════════
//  GALLERY SECTION
// ═══════════════════════════════════════
export async function renderGallery(category = null) {
  const container = document.querySelector('.gallery-grid, [data-section="gallery"]');
  if (!container) return;

  try {
    const items = await Gallery.getAll(category);
    if (!items.length) return;

    container.innerHTML = items.map(item => `
      <div class="gallery-item fade-up" data-cat="${item.category || 'general'}"
           onclick="openLightbox('${item.emoji || '📸'}', '${item.title?.replace(/'/g,"\\'")}', '${item.caption?.replace(/'/g,"\\'")}')">
        <div class="gallery-thumb">
          ${item.imageUrl
            ? `<img src="${item.imageUrl}" alt="${item.title}" loading="lazy">`
            : `<span class="gallery-emoji">${item.emoji || '📸'}</span>`
          }
        </div>
        <div class="gallery-overlay">
          <span class="gallery-title">${item.title}</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('Gallery render failed:', e.message);
  }
}

// ═══════════════════════════════════════
//  NEWS SECTION
// ═══════════════════════════════════════
export async function renderNews(limit = 4) {
  const container = document.querySelector('.news-grid, [data-section="news"]');
  if (!container) return;

  try {
    const items = await News.getAll(limit);
    if (!items.length) return;

    container.innerHTML = items.map(n => `
      <div class="news-card fade-up">
        <div class="news-thumb">${n.emoji || '📰'}</div>
        <div class="news-body">
          <div class="news-date">${n.publishedAt?.toDate
            ? new Date(n.publishedAt.toDate()).toLocaleDateString('en-GB', {month:'short',year:'numeric'})
            : n.dateText || ''}</div>
          <h4>${n.title}</h4>
          ${n.excerpt ? `<p class="news-excerpt">${n.excerpt}</p>` : ''}
          <a href="javascript:void(0)" onclick="openPage('recent')" class="news-arrow">Read more →</a>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('News render failed:', e.message);
  }
}

// ═══════════════════════════════════════
//  SITE SETTINGS (nav logo, footer, SEO)
// ═══════════════════════════════════════
export async function applySiteSettings() {
  try {
    const settings = await SiteSettings.get();
    if (!settings) return;

    // Update page title & meta
    if (settings.siteTitle)       document.title = settings.siteTitle;
    if (settings.metaDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.content = settings.metaDescription;
    }

    // Update nav logo text
    if (settings.logoText) {
      const logo = document.querySelector('.logo-text, .nav-logo');
      if (logo) logo.textContent = settings.logoText;
    }

    // Update social links
    if (settings.facebookUrl) {
      document.querySelectorAll('.social-facebook').forEach(a => a.href = settings.facebookUrl);
    }
    if (settings.githubUrl) {
      document.querySelectorAll('.social-github').forEach(a => a.href = settings.githubUrl);
    }

    // Section visibility toggles
    if (settings.sections) {
      Object.entries(settings.sections).forEach(([section, visible]) => {
        const el = document.getElementById(section) || document.querySelector(`[data-section="${section}"]`);
        if (el) el.style.display = visible ? '' : 'none';
      });
    }
  } catch (e) {
    console.warn('Settings apply failed:', e.message);
  }
}

// ═══════════════════════════════════════
//  CONTACT FORM SUBMISSION
// ═══════════════════════════════════════
export function setupContactForm() {
  const form = document.querySelector('#contactForm, .contact-form form, [data-form="contact"]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const data = {
        name:    form.querySelector('[name="name"]')?.value?.trim(),
        email:   form.querySelector('[name="email"]')?.value?.trim(),
        subject: form.querySelector('[name="subject"]')?.value?.trim() || 'Website Contact',
        message: form.querySelector('[name="message"]')?.value?.trim(),
      };

      // Basic validation
      if (!data.name || !data.email || !data.message) {
        throw new Error('Please fill all required fields.');
      }

      await ContactMessages.send(data);

      // Success
      form.innerHTML = `
        <div class="form-success">
          <div style="font-size:48px;margin-bottom:16px">✓</div>
          <h3>Message Sent!</h3>
          <p>Thank you, ${data.name}. We'll get back to you soon.</p>
        </div>`;

    } catch (err) {
      btn.textContent = originalText;
      btn.disabled = false;
      const errEl = form.querySelector('.form-error') || document.createElement('div');
      errEl.className = 'form-error';
      errEl.textContent = err.message;
      form.appendChild(errEl);
    }
  });
}

// ═══════════════════════════════════════
//  INITIALIZE ALL (call from index.html)
// ═══════════════════════════════════════
export async function initDynamicContent() {
  // Run in parallel for speed
  await Promise.allSettled([
    applySiteSettings(),
    renderHero(),
    renderProjects(),
    renderTeam(),
    renderAchievements(),
    renderGallery(),
    renderNews(4),
  ]);

  setupContactForm();
}