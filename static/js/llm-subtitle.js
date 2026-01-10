// LLM-powered subtitle generator
(function() {
  'use strict';

  // Wait for config to load
  function getConfig() {
    return window.LLM_SUBTITLE_CONFIG || {
      enableAI: false,
      apiToken: '',
      apiModel: 'mistralai/Mistral-7B-Instruct-v0.2',
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
    Object.keys(config.context).forEach(key => {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(placeholder, config.context[key]);
    });
    return prompt;
  }

  // Generate AI subtitle using Hugging Face API
  async function generateWithAI(config, prompt) {
    // Use CORS proxy to bypass browser restrictions
    const corsProxy = 'https://corsproxy.io/?';
    const apiUrl = `${corsProxy}https://router.huggingface.co/v1/chat/completions`;

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization if token is provided
    if (config.apiToken) {
      headers['Authorization'] = `Bearer ${config.apiToken}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: config.apiModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
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

    // Clean up the subtitle
    subtitle = subtitle
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\n.*/g, '') // Take only first line
      .substring(0, 800); // Limit length

    return subtitle;
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

  // Get cached AI insight from localStorage
  function getCachedInsight() {
    try {
      const cached = localStorage.getItem('ai-insight-cache');
      if (cached) {
        const data = JSON.parse(cached);
        // Return cached data if it exists
        if (data.content) {
          console.log('Using cached AI insight');
          return data.content;
        }
      }
    } catch (e) {
      console.error('Error reading cache:', e);
    }
    return null;
  }

  // Save AI insight to localStorage
  function cacheInsight(content) {
    try {
      localStorage.setItem('ai-insight-cache', JSON.stringify({
        content: content,
        timestamp: Date.now()
      }));
      console.log('AI insight cached successfully');
    } catch (e) {
      console.error('Error saving cache:', e);
    }
  }

  // Generate new content (force, bypass cache)
  async function forceGenerate() {
    const modalContent = document.getElementById('ai-modal-content');
    const regenerateBtn = document.getElementById('ai-regenerate');
    if (!modalContent) return;

    // Add spinning animation to button
    if (regenerateBtn) {
      regenerateBtn.classList.add('regenerating');
      regenerateBtn.disabled = true;
    }

    // Show loading state
    modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #555; font-family: Georgia, \'Times New Roman\', Times, serif;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i><br><span style="margin-top: 1rem; display: inline-block; font-size: 1rem; opacity: 0.7;">Generating new insight...</span></div>';

    const config = getConfig();

    // If AI is disabled or no API token, use fallback
    if (!config.enableAI || !config.apiToken) {
      const fallback = getRandomFallback(config);
      modalContent.innerHTML = `<p style="font-size: 1.1rem; margin: 0; color: #555; font-family: Georgia, 'Times New Roman', Times, serif;">${fallback}</p>`;
      if (regenerateBtn) {
        regenerateBtn.classList.remove('regenerating');
        regenerateBtn.disabled = false;
      }
      return;
    }

    // Try AI generation
    try {
      const prompt = buildPrompt(config);
      console.log('Calling Hugging Face API with prompt:', prompt);
      const result = await generateWithAI(config, prompt);
      console.log('Generated content:', result);

      // Cache the successful result
      cacheInsight(result);

      modalContent.innerHTML = `<p style="font-size: 1.1rem; margin: 0; color: #333; font-style: italic; font-family: Georgia, 'Times New Roman', Times, serif;">"${result}"</p>`;
    } catch (error) {
      console.error('AI generation failed:', error);
      console.error('Error details:', error.message, error.stack);
      const fallback = getRandomFallback(config);
      modalContent.innerHTML = `<p style="font-size: 1rem; color: #d9534f; margin-bottom: 1rem; font-family: Georgia, 'Times New Roman', Times, serif;"><i class="fas fa-exclamation-triangle"></i> Generation failed</p><p style="font-size: 1.1rem; color: #555; margin: 0; font-family: Georgia, 'Times New Roman', Times, serif;">${fallback}</p>`;
    } finally {
      // Remove spinning animation from button
      if (regenerateBtn) {
        regenerateBtn.classList.remove('regenerating');
        regenerateBtn.disabled = false;
      }
    }
  }

  // Main function to generate AI content on demand
  async function generateOnDemand() {
    const modalContent = document.getElementById('ai-modal-content');
    if (!modalContent) return;

    // Show modal
    showModal();

    // Check for cached content first
    const cached = getCachedInsight();
    if (cached) {
      modalContent.innerHTML = `<p style="font-size: 1.1rem; margin: 0; color: #333; font-style: italic; font-family: Georgia, 'Times New Roman', Times, serif;">"${cached}"</p><p style="font-size: 0.9rem; color: #999; margin-top: 1rem; text-align: right; font-family: Georgia, 'Times New Roman', Times, serif;"><i class="fas fa-clock"></i> Cached</p>`;
      return;
    }

    // Show loading state if no cache
    modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #555; font-family: Georgia, \'Times New Roman\', Times, serif;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i><br><span style="margin-top: 1rem; display: inline-block; font-size: 1rem; opacity: 0.7;">Generating insight...</span></div>';

    const config = getConfig();

    // If AI is disabled or no API token, use fallback
    if (!config.enableAI || !config.apiToken) {
      const fallback = getRandomFallback(config);
      modalContent.innerHTML = `<p style="font-size: 1.1rem; margin: 0; color: #555; font-family: Georgia, 'Times New Roman', Times, serif;">${fallback}</p>`;
      return;
    }

    // Try AI generation
    try {
      const prompt = buildPrompt(config);
      console.log('Calling Hugging Face API with prompt:', prompt);
      const result = await generateWithAI(config, prompt);
      console.log('Generated content:', result);

      // Cache the successful result
      cacheInsight(result);

      modalContent.innerHTML = `<p style="font-size: 1.1rem; margin: 0; color: #333; font-style: italic; font-family: Georgia, 'Times New Roman', Times, serif;">"${result}"</p>`;
    } catch (error) {
      console.error('AI generation failed:', error);
      console.error('Error details:', error.message, error.stack);
      const fallback = getRandomFallback(config);
      modalContent.innerHTML = `<p style="font-size: 1rem; color: #d9534f; margin-bottom: 1rem; font-family: Georgia, 'Times New Roman', Times, serif;"><i class="fas fa-exclamation-triangle"></i> Generation failed</p><p style="font-size: 1.1rem; color: #555; margin: 0; font-family: Georgia, 'Times New Roman', Times, serif;">${fallback}</p>`;
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
      trigger.addEventListener('click', generateOnDemand);
    }

    // Add click handler to regenerate button
    const regenerateBtn = document.getElementById('ai-regenerate');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent modal close
        forceGenerate();
      });
    }

    // Add click handler to close button
    const closeBtn = document.getElementById('ai-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideModal);
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
