// LLM-powered subtitle generator with history
(function() {
  'use strict';

  let currentIndex = 0;

  // Wait for config to load
  function getConfig() {
    return window.LLM_SUBTITLE_CONFIG || {
      enableAI: false,
      apiToken: '',
      apiModel: 'meta-llama/Llama-3.2-3B-Instruct',
      context: {
        role: 'senior engineer developer',
        interests: 'authentication and security',
        blogStyle: 'technical insights',
        tone: 'professional'
      },
      promptTemplate: 'Generate a short subtitle for a developer blog.',
      fallbackMessages: [
        "Building secure systems with code and coffee",
        "Where code meets creativity"
      ]
    };
  }

  // Get random fallback message
  function getRandomFallback(config) {
    const messages = config.fallbackMessages || ['Welcome to my blog'];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Build prompt from template and context
  function buildPrompt(config) {
    let prompt = config.promptTemplate;
    if (config.context) {
      Object.keys(config.context).forEach(key => {
        const placeholder = `{${key}}`;
        prompt = prompt.replace(placeholder, config.context[key]);
      });
    }
    return prompt;
  }

  // Generate AI subtitle using Hugging Face API
  async function generateWithAI(config, prompt) {
    const corsProxy = 'https://corsproxy.io/?';
    const apiUrl = `${corsProxy}https://router.huggingface.co/v1/chat/completions`;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (config.apiToken) {
      headers['Authorization'] = `Bearer ${config.apiToken}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: config.apiModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let subtitle = data.choices?.[0]?.message?.content?.trim();

    if (!subtitle) {
      throw new Error('No text generated');
    }

    subtitle = subtitle
      .replace(/^["']|["']$/g, '')
      .replace(/\n.*/g, '')
      .substring(0, 500);

    return subtitle;
  }

  // Get all insights from localStorage
  function getInsights() {
    try {
      const stored = localStorage.getItem('ai-insights-history');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading insights:', e);
      return [];
    }
  }

  // Save insights to localStorage (keep only last 10)
  function saveInsights(insights) {
    try {
      const toSave = insights.slice(-10);
      localStorage.setItem('ai-insights-history', JSON.stringify(toSave));
    } catch (e) {
      console.error('Error saving insights:', e);
    }
  }

  // Add new insight
  function addInsight(content) {
    const insights = getInsights();
    insights.push({
      content: content,
      timestamp: Date.now()
    });
    saveInsights(insights);
    return insights.length - 1; // Return index of new insight
  }

  // Show modal
  function showModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  // Hide modal
  function hideModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Update navigation UI
  function updateNavigation() {
    const insights = getInsights();
    const nav = document.getElementById('ai-navigation');
    const counter = document.getElementById('ai-counter');
    const prevBtn = document.getElementById('ai-prev');
    const nextBtn = document.getElementById('ai-next');
    const regenerateBtn = document.getElementById('ai-regenerate');

    if (!nav || !counter || !prevBtn || !nextBtn) return;

    if (insights.length > 0) {
      nav.style.display = 'flex';
      counter.textContent = `${currentIndex + 1} of ${insights.length}`;

      // Disable/enable buttons based on position
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === insights.length - 1;

      prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '1';
      nextBtn.style.opacity = currentIndex === insights.length - 1 ? '0.3' : '1';
    } else {
      nav.style.display = 'none';
    }

    // Disable regenerate button if we have 10 insights
    if (regenerateBtn) {
      if (insights.length >= 10) {
        regenerateBtn.disabled = true;
        regenerateBtn.style.opacity = '0.3';
        regenerateBtn.title = 'Maximum insights reached (10)';
      } else {
        regenerateBtn.disabled = false;
        regenerateBtn.style.opacity = '1';
        regenerateBtn.title = 'Generate new insight';
      }
    }
  }

  // Display current insight
  function displayCurrentInsight() {
    const insights = getInsights();
    const modalContent = document.getElementById('ai-modal-content');

    if (!modalContent || insights.length === 0) return;

    const insight = insights[currentIndex];

    modalContent.innerHTML = `<p>${insight.content}</p>`;
    updateNavigation();
  }

  // Navigate to previous insight
  function navigatePrev() {
    const insights = getInsights();
    if (currentIndex > 0) {
      currentIndex--;
      displayCurrentInsight();
    }
  }

  // Navigate to next insight
  function navigateNext() {
    const insights = getInsights();
    if (currentIndex < insights.length - 1) {
      currentIndex++;
      displayCurrentInsight();
    }
  }

  // Generate new content (force, bypass cache)
  async function forceGenerate() {
    const modalContent = document.getElementById('ai-modal-content');
    const regenerateBtn = document.getElementById('ai-regenerate');
    if (!modalContent) return;

    // Check if we already have 10 insights
    const insights = getInsights();
    if (insights.length >= 10) {
      return;
    }

    // Add spinning animation to button
    if (regenerateBtn) {
      regenerateBtn.classList.add('regenerating');
      regenerateBtn.disabled = true;
    }

    // Show loading state
    modalContent.innerHTML = '<p style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Generating new insight...</p>';

    const config = getConfig();

    try {
      let content;

      if (!config.enableAI || !config.apiToken) {
        content = getRandomFallback(config);
      } else {
        const prompt = buildPrompt(config);
        console.log('Calling Hugging Face API with prompt:', prompt);
        content = await generateWithAI(config, prompt);
        console.log('Generated content:', content);
      }

      // Add to history and set as current
      currentIndex = addInsight(content);
      displayCurrentInsight();

    } catch (error) {
      console.error('AI generation failed:', error);
      const fallback = getRandomFallback(config);
      modalContent.innerHTML = `<p><strong>Generation failed</strong></p><p>${fallback}</p>`;
    } finally {
      if (regenerateBtn) {
        regenerateBtn.classList.remove('regenerating');
        regenerateBtn.disabled = false;
      }
    }
  }

  // Main function to open modal
  async function openModal() {
    const modalContent = document.getElementById('ai-modal-content');
    if (!modalContent) return;

    // Show modal
    showModal();

    const insights = getInsights();

    if (insights.length > 0) {
      // Show the most recent insight
      currentIndex = insights.length - 1;
      displayCurrentInsight();
    } else {
      // No insights yet, generate first one
      modalContent.innerHTML = '<p style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Generating insight...</p>';

      const config = getConfig();

      try {
        let content;

        if (!config.enableAI || !config.apiToken) {
          content = getRandomFallback(config);
        } else {
          const prompt = buildPrompt(config);
          content = await generateWithAI(config, prompt);
        }

        currentIndex = addInsight(content);
        displayCurrentInsight();

      } catch (error) {
        console.error('AI generation failed:', error);
        const fallback = getRandomFallback(config);
        modalContent.innerHTML = `<p><strong>Generation failed</strong></p><p>${fallback}</p>`;
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAI);
  } else {
    initAI();
  }

  function initAI() {
    // Add click handler to AI trigger
    const trigger = document.getElementById('ai-trigger');
    if (trigger) {
      trigger.addEventListener('click', openModal);
    }

    // Add click handler to regenerate button
    const regenerateBtn = document.getElementById('ai-regenerate');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        forceGenerate();
      });
    }

    // Add click handler to close button
    const closeBtn = document.getElementById('ai-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideModal);
    }

    // Add navigation handlers
    const prevBtn = document.getElementById('ai-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', navigatePrev);
    }

    const nextBtn = document.getElementById('ai-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', navigateNext);
    }

    // Close modal when clicking outside
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          hideModal();
        }
      });
    }
  }
})();
