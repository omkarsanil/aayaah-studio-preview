import { contact } from './contact-config.js';

const menu = document.querySelector('[data-menu]');
const nav = document.querySelector('.nav-links');
function closeMenu() { nav?.classList.remove('is-open'); menu?.setAttribute('aria-expanded','false'); }
menu?.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  let count = 0;
  document.querySelectorAll('[data-category]').forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    if (!card.hidden) count++;
  });
  document.querySelector('[data-filter-status]').textContent = `${count} ${count === 1 ? 'piece' : 'pieces'} shown.`;
}));

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const gallery = document.querySelector('.hero-gallery');
const stage = document.querySelector('.gallery-stage');
const motionButton = document.querySelector('[data-motion]');
const galleryPanels = [...document.querySelectorAll('.gallery-panel')];
const compactScreen = matchMedia('(max-width: 760px)');
const pageProgress = document.querySelector('[data-page-progress]');
let manualPause = false;
let pendingFrame = false;
function updateMotion() {
  pendingFrame = false;
  const availableScroll = document.documentElement.scrollHeight - innerHeight;
  const readingProgress = availableScroll > 0 ? Math.min(1, Math.max(0, scrollY / availableScroll)) : 0;
  pageProgress?.style.setProperty('--page-progress', String(readingProgress));
  if (!stage) return;
  const paused = manualPause || reduceMotion.matches;
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = reduceMotion.matches ? 'Reduced motion enabled' : paused ? 'Resume 3D scroll' : 'Pause 3D scroll';
  motionButton.disabled = reduceMotion.matches;
  if (paused) {
    stage.style.setProperty('--gallery-tilt','0deg');
    stage.style.setProperty('--gallery-shift','0px');
    galleryPanels.forEach(panel => {
      panel.style.setProperty('--scroll-drift','0px');
      panel.style.setProperty('--scroll-yaw','0deg');
    });
    return;
  }
  const rect = gallery.getBoundingClientRect();
  if (rect.bottom < -100 || rect.top > innerHeight + 100) return;
  const progress = Math.max(-1, Math.min(1, (innerHeight * .48 - rect.top - rect.height * .5) / innerHeight));
  stage.style.setProperty('--gallery-tilt', `${3 + progress * 13}deg`);
  stage.style.setProperty('--gallery-shift', `${progress * 36}px`);
  galleryPanels.forEach((panel,index) => {
    const direction = index % 2 === 0 ? -1 : 1;
    panel.style.setProperty('--scroll-drift', `${compactScreen.matches ? progress * direction * 18 : 0}px`);
    panel.style.setProperty('--scroll-yaw', `${compactScreen.matches ? progress * direction * 5 : 0}deg`);
  });
}
function requestMotion() { if(!pendingFrame) { pendingFrame = true; requestAnimationFrame(updateMotion); } }
if(stage || pageProgress) {
  addEventListener('scroll',requestMotion,{passive:true});
  addEventListener('resize',requestMotion,{passive:true});
  reduceMotion.addEventListener('change',updateMotion);
  compactScreen.addEventListener('change',updateMotion);
  motionButton?.addEventListener('click',() => { manualPause = !manualPause; updateMotion(); });
  updateMotion();
}

const enquiry = document.querySelector('#enquiry-dialog');
const message = enquiry.querySelector('textarea');
const channelButtons = enquiry.querySelectorAll('[data-select-channel]');
const contactTarget = enquiry.querySelector('[data-contact-target]');
const contactAction = enquiry.querySelector('[data-contact-action]');
const enquiryStatus = enquiry.querySelector('[data-enquiry-status]');
let channel = 'whatsapp';
function selectChannel(next) {
  channel = next;
  channelButtons.forEach(b => b.setAttribute('aria-pressed',String(b.dataset.selectChannel === channel)));
  contactTarget.textContent = channel === 'whatsapp' ? contact.whatsappLabel : contact.instagramLabel;
  contactAction.textContent = contact.demo ? 'Copy enquiry message' : `Continue to ${channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'}`;
  enquiryStatus.textContent = '';
}
document.querySelectorAll('[data-enquire]').forEach(button => button.addEventListener('click', () => {
  const piece = button.dataset.enquire || 'a custom piece';
  message.value = `Hi Aayaah, I’m interested in ${piece}. Could we discuss the available designs, size, price range, and delivery? My preferred size is ___ and my budget is ___.`;
  selectChannel(button.dataset.channel || 'whatsapp');
  enquiry.showModal();
}));
channelButtons.forEach(button => button.addEventListener('click',() => selectChannel(button.dataset.selectChannel)));
contactAction.addEventListener('click',async () => {
  if (contact.demo) {
    try { await navigator.clipboard.writeText(message.value); enquiryStatus.textContent = 'Message copied. Live contact details will be added before launch.'; }
    catch { message.focus(); message.select(); enquiryStatus.textContent = 'Select and copy the message. Live contact details are not connected yet.'; }
    return;
  }
  const destination = channel === 'whatsapp' ? `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(message.value)}` : `https://www.instagram.com/${encodeURIComponent(contact.instagramHandle)}/`;
  window.open(destination,'_blank','noopener,noreferrer');
});
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click',() => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click',e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } }));

const storageKey = 'aayaah-privacy-v1';
const privacyBanner = document.querySelector('[data-cookie-banner]');
const privacyDialog = document.querySelector('#privacy-dialog');
const privacyStatus = document.querySelector('[data-privacy-status]');
let savedChoice = false;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  savedChoice = saved?.choice === 'remember' && saved.expires > Date.now();
  if(saved && !savedChoice) localStorage.removeItem(storageKey);
} catch { savedChoice = false; }
privacyBanner.hidden = savedChoice;
function updatePrivacyStatus() { privacyStatus.textContent = savedChoice ? 'Your preference is saved on this device for up to 180 days. No analytics or advertising are enabled.' : 'No preference is saved. No analytics or advertising are enabled.'; }
document.querySelectorAll('[data-cookie-settings]').forEach(button => button.addEventListener('click', () => { updatePrivacyStatus(); privacyDialog.showModal(); }));
document.querySelectorAll('[data-privacy-choice]').forEach(button => button.addEventListener('click', () => {
  savedChoice = button.dataset.privacyChoice === 'remember';
  try {
    if(savedChoice) localStorage.setItem(storageKey,JSON.stringify({choice:'remember',expires:Date.now()+180*86400000}));
    else localStorage.removeItem(storageKey);
  } catch { savedChoice = false; }
  privacyBanner.hidden = true;
  if(privacyDialog.open) privacyDialog.close();
}));
document.querySelectorAll('[data-demo-notice]').forEach(el => { el.hidden = !contact.demo; });
