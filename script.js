const dreamForm = document.getElementById('dreamForm');
const dreamList = document.getElementById('dreamList');
const formStatus = document.getElementById('formStatus');
const paymentInfoBox = document.getElementById('paymentInfoBox');
const btcAmount = document.getElementById('btcAmount');
const ethAmount = document.getElementById('ethAmount');
const btcAddress = document.getElementById('btcAddress');
const ethAddress = document.getElementById('ethAddress');
const copyBtcBtn = document.getElementById('copyBtc');
const copyEthBtn = document.getElementById('copyEth');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const submitDreamBtn = document.getElementById('submitDream');

const BTC_ADDRESS = 'bc1qvxukeasjgkz7nzvrvk9a9er7a33rstrdv5u4e5';
const ETH_ADDRESS = '0x43Cd79268989418085d4F5C17137c29BbBd3d1de';
const PAYMENT_USD = 5;
const STORAGE_KEY = 'demystifyDreamData';
const STORAGE_PAYMENT_KEY = 'demystifyPaidSecondPost';

let exchangeRates = { btc: null, eth: null };
let paymentConfirmed = localStorage.getItem(STORAGE_PAYMENT_KEY) === 'true';

btcAddress.textContent = BTC_ADDRESS;
ethAddress.textContent = ETH_ADDRESS;

async function fetchRates() {
  const apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Failed fetching rates');
    const data = await response.json();
    exchangeRates.btc = data.bitcoin?.usd ? PAYMENT_USD / data.bitcoin.usd : null;
    exchangeRates.eth = data.ethereum?.usd ? PAYMENT_USD / data.ethereum.usd : null;
  } catch (error) {
    console.warn('Rate fetch failed:', error);
    exchangeRates.btc = null;
    exchangeRates.eth = null;
  }

  updateRateDisplays();
}

function updateRateDisplays() {
  btcAmount.textContent = exchangeRates.btc ? `${exchangeRates.btc.toFixed(8)} BTC` : 'Unable to load BTC rate';
  ethAmount.textContent = exchangeRates.eth ? `${exchangeRates.eth.toFixed(6)} ETH` : 'Unable to load ETH rate';
}

function saveDreams(dreams) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
}

function loadDreams() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.warn('Invalid dream storage; resetting.', error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function getDreamCount() {
  return loadDreams().length;
}

function showStatus(message, success = true) {
  formStatus.textContent = message;
  formStatus.style.color = success ? '#166534' : '#991b1b';
}

function copyToClipboard(value, text) {
  if (!navigator.clipboard) {
    showStatus('Clipboard is not available in this browser.', false);
    return;
  }
  navigator.clipboard.writeText(value).then(() => {
    showStatus(`${text} copied to clipboard.`);
  }).catch(() => {
    showStatus('Copy failed. Please copy the address manually.', false);
  });
}

function renderDreams() {
  const dreams = loadDreams();
  dreamList.innerHTML = '';
  if (!dreams.length) {
    dreamList.innerHTML = '<p>No dreams posted yet. Be the first to share yours.</p>';
    return;
  }

  dreams.slice().reverse().forEach((dream) => {
    const card = document.createElement('article');
    card.className = 'dream-card';

    const title = document.createElement('h3');
    title.textContent = `${dream.name} shared a dream`;
    card.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'dream-meta';
    const createdDate = new Date(dream.createdAt).toLocaleString();
    meta.textContent = `Posted on ${createdDate}`;
    card.appendChild(meta);

    const text = document.createElement('p');
    text.className = 'dream-text';
    text.textContent = dream.text;
    card.appendChild(text);

    // Add star rating section
    const ratingSection = document.createElement('div');
    ratingSection.className = 'rating-section';

    const ratingTitle = document.createElement('h4');
    ratingTitle.textContent = 'Rate this dream';
    ratingSection.appendChild(ratingTitle);

    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    
    const ratings = dream.ratings || [];
    const averageRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.textContent = '★';
      star.style.cursor = 'pointer';
      star.dataset.value = i;
      
      if (i <= Math.ceil(averageRating)) {
        star.classList.add('filled');
      }
      
      star.addEventListener('click', () => {
        const allDreams = loadDreams();
        const targetDream = allDreams.find((item) => item.id === dream.id);
        if (!targetDream) {
          showStatus('Could not find the dream to rate.', false);
          return;
        }
        targetDream.ratings = targetDream.ratings || [];
        targetDream.ratings.push(i);
        saveDreams(allDreams);
        renderDreams();
        showStatus('Rating submitted successfully!');
      });
      
      starsContainer.appendChild(star);
    }
    
    const ratingInfo = document.createElement('div');
    ratingInfo.className = 'rating-info';
    ratingInfo.innerHTML = `<span class="average-rating">${averageRating}</span> stars from <span class="rating-count">${ratings.length}</span> ratings`;
    ratingSection.appendChild(starsContainer);
    ratingSection.appendChild(ratingInfo);
    card.appendChild(ratingSection);

    const commentSection = document.createElement('div');
    commentSection.className = 'comment-section';

    const commentTitle = document.createElement('h4');
    commentTitle.textContent = 'Reviews & comments';
    commentSection.appendChild(commentTitle);

    const commentList = document.createElement('ul');
    commentList.className = 'comment-list';
    if (Array.isArray(dream.comments) && dream.comments.length > 0) {
      dream.comments.slice().reverse().forEach((comment) => {
        const commentItem = document.createElement('li');
        commentItem.className = 'comment-item';
        commentItem.innerHTML = `<strong>${comment.by}</strong><span>${new Date(comment.createdAt).toLocaleString()}</span><p>${comment.text}</p>`;
        commentList.appendChild(commentItem);
      });
    } else {
      commentList.innerHTML = '<li class="comment-item">No comments yet. Add the first review.</li>';
    }
    commentSection.appendChild(commentList);

    const commentForm = document.createElement('form');
    commentForm.className = 'comment-form';
    commentForm.innerHTML = `
      <label>Reviewer name</label>
      <input type="text" name="reviewerName" placeholder="Your name" required />
      <label>Comment</label>
      <textarea name="commentText" rows="3" placeholder="Write a review or comment" required></textarea>
      <button type="submit" class="secondary">Add review</button>
    `;

    commentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(commentForm);
      const reviewerName = formData.get('reviewerName').trim();
      const commentText = formData.get('commentText').trim();
      if (!reviewerName || !commentText) {
        showStatus('Both reviewer name and comment are required.', false);
        return;
      }
      const allDreams = loadDreams();
      const targetDream = allDreams.find((item) => item.id === dream.id);
      if (!targetDream) {
        showStatus('Could not find the dream to comment on.', false);
        return;
      }
      targetDream.comments = targetDream.comments || [];
      targetDream.comments.push({
        by: reviewerName,
        text: commentText,
        createdAt: new Date().toISOString(),
      });
      saveDreams(allDreams);
      renderDreams();
      showStatus('Review added successfully.');
    });

    commentSection.appendChild(commentForm);
    card.appendChild(commentSection);
    dreamList.appendChild(card);
  });
}

function updatePaymentInfoDisplay() {
  const count = getDreamCount();
  if (count === 0) {
    paymentInfoBox.style.display = 'block';
    paymentInfoBox.querySelector('p').textContent = 'Your first dream is free. For the second dream publish, please send exactly $5 in BTC or ETH to the address shown below.';
  } else if (count === 1 && !paymentConfirmed) {
    paymentInfoBox.style.display = 'block';
    paymentInfoBox.querySelector('p').textContent = 'To publish your second dream, send $5 in BTC or ETH to one of the addresses below and then tap the confirmation button.';
  } else {
    paymentInfoBox.style.display = 'none';
  }
}

function checkPaymentRequirement() {
  const count = getDreamCount();
  if (count === 0) return false;
  if (count >= 1 && !paymentConfirmed) return true;
  return false;
}

dreamForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nameInput = dreamForm.elements.dreamerName;
  const dreamTextInput = dreamForm.elements.dreamText;
  const name = nameInput.value.trim();
  const text = dreamTextInput.value.trim();

  if (!name || !text) {
    showStatus('Please enter both your name and your dream.', false);
    return;
  }

  if (checkPaymentRequirement()) {
    showStatus('Second dream requires a $5 BTC or ETH payment first.', false);
    return;
  }

  const dreams = loadDreams();
  dreams.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    text,
    createdAt: new Date().toISOString(),
    comments: [],
    ratings: [],
  });

  saveDreams(dreams);
  renderDreams();
  updatePaymentInfoDisplay();
  dreamForm.reset();
  showStatus('Your dream has been published successfully.');
});

copyBtcBtn.addEventListener('click', () => {
  copyToClipboard(BTC_ADDRESS, 'Bitcoin address');
});

copyEthBtn.addEventListener('click', () => {
  copyToClipboard(ETH_ADDRESS, 'Ethereum address');
});

confirmPaymentBtn.addEventListener('click', () => {
  paymentConfirmed = true;
  localStorage.setItem(STORAGE_PAYMENT_KEY, 'true');
  updatePaymentInfoDisplay();
  showStatus('Payment confirmed locally. You can now publish your second dream.');
});

window.addEventListener('load', () => {
  renderDreams();
  fetchRates();
  updatePaymentInfoDisplay();
});
