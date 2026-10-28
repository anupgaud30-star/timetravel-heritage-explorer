/**
 * TimeTravel Voice Companion — Frontend Engine
 * Handles Web Speech Recognition, Speech Synthesis, UI State, and RESTful API sync.
 */

(function () {
    'use strict';

    // Application State
    const AppState = {
        voiceState: 'IDLE', // 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR'
        activeConversationId: null,
        isSubmitting: false,
        recognition: null,
        synth: window.speechSynthesis || null,
        currentUtterance: null,
        speechSupported: false,
        voices: []
    };

    // DOM Elements Cache
    const DOM = {
        // Status & Mode
        backendStatusIndicator: document.getElementById('backendStatusIndicator'),
        backendStatusText: document.getElementById('backendStatusText'),
        backendModeBadge: document.getElementById('backendModeBadge'),
        voiceStateBadge: document.getElementById('voiceStateBadge'),
        voiceStateLabel: document.getElementById('voiceStateLabel'),
        speechSupportWarning: document.getElementById('speechSupportWarning'),

        // Orb Stage
        orbContainer: document.getElementById('orbContainer'),
        soundwaveBars: document.getElementById('soundwaveBars'),
        startListeningBtn: document.getElementById('startListeningBtn'),
        startListeningText: document.getElementById('startListeningText'),
        stopListeningBtn: document.getElementById('stopListeningBtn'),
        stopSpeakingBtn: document.getElementById('stopSpeakingBtn'),

        // Form & Transcript
        questionForm: document.getElementById('questionForm'),
        questionInput: document.getElementById('questionInput'),
        charCounter: document.getElementById('charCounter'),
        sendBtn: document.getElementById('sendBtn'),
        transcriptContainer: document.getElementById('transcriptContainer'),
        clearActiveChatBtn: document.getElementById('clearActiveChatBtn'),
        suggestedChips: document.querySelectorAll('.chip-btn'),

        // Sidebar
        historySidebar: document.getElementById('historySidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
        closeSidebarBtn: document.getElementById('closeSidebarBtn'),
        newChatBtn: document.getElementById('newChatBtn'),
        clearAllHistoryBtn: document.getElementById('clearAllHistoryBtn'),
        historyList: document.getElementById('historyList')
    };

    /* ==========================================================================
       1. Speech Recognition & Synthesis Initialization
       ========================================================================== */

    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            AppState.speechSupported = true;
            try {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    setVoiceState('LISTENING');
                    DOM.startListeningBtn.classList.add('hidden');
                    DOM.stopListeningBtn.classList.remove('hidden');
                };

                recognition.onresult = (event) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    const currentSpoken = (finalTranscript || interimTranscript).trim();
                    if (currentSpoken) {
                        DOM.questionInput.value = currentSpoken;
                        updateCharCount();
                    }
                };

                recognition.onerror = (event) => {
                    console.warn('Speech recognition error:', event.error);
                    if (event.error === 'not-allowed') {
                        showTemporaryError('Microphone permission denied. Please allow microphone access or type below.');
                    } else if (event.error === 'no-speech') {
                        setVoiceState('IDLE');
                    } else {
                        showTemporaryError(`Voice input error: ${event.error}`);
                    }
                    resetVoiceButtons();
                };

                recognition.onend = () => {
                    resetVoiceButtons();
                    // If question input has text and was spoken, submit question
                    const text = DOM.questionInput.value.trim();
                    if (AppState.voiceState === 'LISTENING') {
                        if (text.length >= 2) {
                            submitQuestion(text);
                        } else {
                            setVoiceState('IDLE');
                        }
                    }
                };

                AppState.recognition = recognition;
            } catch (err) {
                console.error('Failed to create SpeechRecognition instance:', err);
                AppState.speechSupported = false;
            }
        }

        if (!AppState.speechSupported) {
            DOM.speechSupportWarning.classList.remove('hidden');
            DOM.startListeningBtn.disabled = true;
            DOM.startListeningBtn.title = 'Speech recognition not supported in this browser. Please type below.';
            DOM.startListeningText.textContent = 'Voice Unavailable (Use Typing)';
        }
    }

    function initSpeechSynthesis() {
        if (!AppState.synth) {
            console.warn('Web SpeechSynthesis not supported.');
            return;
        }

        function loadVoices() {
            AppState.voices = AppState.synth.getVoices();
        }

        loadVoices();
        if (AppState.synth.onvoiceschanged !== undefined) {
            AppState.synth.onvoiceschanged = loadVoices;
        }
    }

    function getBestVoice() {
        if (!AppState.voices || AppState.voices.length === 0) return null;
        // Prefer natural, expressive English voices
        const preferred = [
            'Google UK English Male',
            'Google UK English Female',
            'Google US English',
            'Daniel',
            'Oliver',
            'Samantha',
            'Serena'
        ];

        for (const name of preferred) {
            const found = AppState.voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
            if (found) return found;
        }

        // Fallback: any English voice
        const englishVoice = AppState.voices.find(v => v.lang.startsWith('en'));
        return englishVoice || AppState.voices[0];
    }

    function speakAnswer(text) {
        if (!AppState.synth) return;

        // Cancel previous speech
        stopSpeaking();

        // Clean text for speech: remove bracketed notes and strange punctuation
        const cleanSpeech = text
            .replace(/\[System Note:.*?\]/gis, '')
            .replace(/[*_#`~>]/g, '')
            .trim();

        if (!cleanSpeech) return;

        const utterance = new SpeechSynthesisUtterance(cleanSpeech);
        const voice = getBestVoice();
        if (voice) utterance.voice = voice;

        utterance.rate = 0.98; // Stately, distinguished pace
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            setVoiceState('SPEAKING');
            DOM.stopSpeakingBtn.classList.remove('hidden');
        };

        utterance.onend = () => {
            if (AppState.voiceState === 'SPEAKING') {
                setVoiceState('IDLE');
            }
            DOM.stopSpeakingBtn.classList.add('hidden');
            AppState.currentUtterance = null;
        };

        utterance.onerror = (e) => {
            console.warn('Speech synthesis error:', e);
            if (AppState.voiceState === 'SPEAKING') {
                setVoiceState('IDLE');
            }
            DOM.stopSpeakingBtn.classList.add('hidden');
            AppState.currentUtterance = null;
        };

        AppState.currentUtterance = utterance;
        AppState.synth.speak(utterance);
    }

    function stopSpeaking() {
        if (AppState.synth) {
            AppState.synth.cancel();
        }
        DOM.stopSpeakingBtn.classList.add('hidden');
        if (AppState.voiceState === 'SPEAKING') {
            setVoiceState('IDLE');
        }
        AppState.currentUtterance = null;
    }

    function resetVoiceButtons() {
        DOM.startListeningBtn.classList.remove('hidden');
        DOM.stopListeningBtn.classList.add('hidden');
    }

    /* ==========================================================================
       2. Voice State & UI Orchestration
       ========================================================================== */

    function setVoiceState(state) {
        AppState.voiceState = state;
        DOM.voiceStateLabel.textContent = state;

        // Reset state classes
        const classes = ['state-idle', 'state-listening', 'state-thinking', 'state-speaking', 'state-error'];
        classes.forEach(c => {
            DOM.voiceStateBadge.classList.remove(c);
            DOM.orbContainer.classList.remove(c);
        });

        // Add active state class
        const stateClass = `state-${state.toLowerCase()}`;
        DOM.voiceStateBadge.classList.add(stateClass);
        DOM.orbContainer.classList.add(stateClass);

        // Lock/unlock submission controls during processing
        const isBusy = (state === 'THINKING' || state === 'LISTENING');
        DOM.sendBtn.disabled = isBusy;
    }

    function showTemporaryError(message) {
        setVoiceState('ERROR');
        appendSystemMessage(message, true);
        setTimeout(() => {
            if (AppState.voiceState === 'ERROR') {
                setVoiceState('IDLE');
            }
        }, 3500);
    }

    function updateCharCount() {
        const len = DOM.questionInput.value.length;
        DOM.charCounter.textContent = `${len}/1000`;
    }

    /* ==========================================================================
       3. Backend Health & Synchronization
       ========================================================================== */

    async function checkBackendHealth() {
        try {
            const res = await fetch('/api/health');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            DOM.backendStatusIndicator.classList.remove('error');
            DOM.backendStatusIndicator.classList.add('healthy');
            DOM.backendStatusText.textContent = 'Connected';

            if (data.mode === 'live') {
                DOM.backendModeBadge.textContent = 'LIVE AI';
                DOM.backendModeBadge.classList.add('mode-live');
                DOM.backendModeBadge.title = `Connected to OpenAI (${data.model})`;
            } else {
                DOM.backendModeBadge.textContent = 'DEMO';
                DOM.backendModeBadge.classList.remove('mode-live');
                DOM.backendModeBadge.title = 'Historical Demo Mode (offline sample responses)';
            }
        } catch (err) {
            console.error('Health check failed:', err);
            DOM.backendStatusIndicator.classList.remove('healthy');
            DOM.backendStatusIndicator.classList.add('error');
            DOM.backendStatusText.textContent = 'Offline';
            DOM.backendModeBadge.textContent = 'UNREACHABLE';
        }
    }

    /* ==========================================================================
       4. Dialogue Submission & Messaging
       ========================================================================== */

    async function submitQuestion(questionText) {
        const text = (questionText || DOM.questionInput.value).trim();
        if (!text || text.length < 2 || AppState.isSubmitting) return;

        // Prevent duplicate submissions
        AppState.isSubmitting = true;
        setVoiceState('THINKING');
        DOM.questionInput.value = '';
        updateCharCount();

        // Append user turn to transcript
        appendUserMessage(text);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    conversation_id: AppState.activeConversationId
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Server responded with ${response.status}`);
            }

            const data = await response.json();
            AppState.activeConversationId = data.conversation_id;

            // Render assistant response
            appendAssistantMessage(data.response, data.mode);

            // Trigger speech playback
            speakAnswer(data.response);

            // Refresh conversation archive list
            loadConversationHistory();
        } catch (err) {
            console.error('Failed to submit question:', err);
            showTemporaryError(`Dialogue Error: ${err.message}`);
        } finally {
            AppState.isSubmitting = false;
            if (AppState.voiceState === 'THINKING') {
                setVoiceState('IDLE');
            }
        }
    }

    function appendUserMessage(text) {
        const card = document.createElement('div');
        card.className = 'message-card message-user';
        card.innerHTML = `
            <div class="message-header">
                <div class="speaker-identity">
                    <span class="speaker-avatar">🧭</span>
                    <span class="speaker-name">Seeker</span>
                </div>
            </div>
            <div class="message-body">
                <p>${escapeHtml(text)}</p>
            </div>
        `;
        DOM.transcriptContainer.appendChild(card);
        scrollToBottom();
    }

    function appendAssistantMessage(text, mode) {
        const card = document.createElement('div');
        card.className = 'message-card message-assistant';
        
        const isLive = mode === 'live';
        const modePillHtml = isLive 
            ? `<span class="mode-pill pill-live">✦ Live AI</span>`
            : `<span class="mode-pill pill-demo">⚜ Demo Knowledge</span>`;

        // Format paragraphs nicely
        const paragraphs = text
            .split(/\n\n+/)
            .map(p => `<p>${escapeHtml(p.trim())}</p>`)
            .join('');

        card.innerHTML = `
            <div class="message-header">
                <div class="speaker-identity">
                    <span class="speaker-avatar">⚜️</span>
                    <span class="speaker-name">TimeTravel Companion</span>
                </div>
                ${modePillHtml}
            </div>
            <div class="message-body">
                ${paragraphs}
            </div>
            <div class="message-footer-actions">
                <button class="msg-action-btn read-aloud-btn" title="Read response aloud">
                    <span>🔊</span> Speak
                </button>
                <button class="msg-action-btn copy-text-btn" title="Copy response to clipboard">
                    <span>📋</span> Copy
                </button>
            </div>
        `;

        // Wire Speak button
        const speakBtn = card.querySelector('.read-aloud-btn');
        speakBtn.addEventListener('click', () => {
            speakAnswer(text);
        });

        // Wire Copy button
        const copyBtn = card.querySelector('.copy-text-btn');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(text);
                copyBtn.innerHTML = '<span>✓</span> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<span>📋</span> Copy';
                }, 2000);
            } catch (e) {
                console.warn('Clipboard write failed:', e);
            }
        });

        DOM.transcriptContainer.appendChild(card);
        scrollToBottom();
    }

    function appendSystemMessage(text, isError = false) {
        const card = document.createElement('div');
        card.className = `message-card message-assistant ${isError ? 'system-error' : ''}`;
        card.innerHTML = `
            <div class="message-header">
                <div class="speaker-identity">
                    <span class="speaker-avatar">${isError ? '⚠️' : 'ℹ️'}</span>
                    <span class="speaker-name">${isError ? 'Notice' : 'Chronicle Update'}</span>
                </div>
            </div>
            <div class="message-body" style="font-size: 0.95rem; color: ${isError ? '#fca5a5' : '#c2beaf'};">
                <p>${escapeHtml(text)}</p>
            </div>
        `;
        DOM.transcriptContainer.appendChild(card);
        scrollToBottom();
    }

    function scrollToBottom() {
        DOM.transcriptContainer.scrollTop = DOM.transcriptContainer.scrollHeight;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* ==========================================================================
       5. Conversation History & Sessions
       ========================================================================== */

    async function loadConversationHistory() {
        try {
            const res = await fetch('/api/conversations');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            renderConversationList(data.conversations || []);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    }

    function renderConversationList(conversations) {
        DOM.historyList.innerHTML = '';

        if (conversations.length === 0) {
            DOM.historyList.innerHTML = `<div class="history-empty-state">No previous chronicles.</div>`;
            return;
        }

        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = `history-item ${conv.id === AppState.activeConversationId ? 'active' : ''}`;
            item.dataset.id = conv.id;

            // Formatted date
            const dateStr = conv.updated_at ? new Date(conv.updated_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : '';

            item.innerHTML = `
                <div class="history-item-content">
                    <div class="history-item-title">${escapeHtml(conv.title || 'Exploration')}</div>
                    <div class="history-item-date">${dateStr} · ${conv.message_count} entries</div>
                </div>
                <button class="history-item-delete" title="Delete conversation" aria-label="Delete">✕</button>
            `;

            // Click conversation
            item.querySelector('.history-item-content').addEventListener('click', () => {
                selectConversation(conv.id);
            });

            // Delete single conversation
            item.querySelector('.history-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSingleConversation(conv.id);
            });

            DOM.historyList.appendChild(item);
        });
    }

    async function selectConversation(convId) {
        try {
            stopSpeaking();
            const res = await fetch(`/api/conversations/${convId}`);
            if (!res.ok) throw new Error('Conversation not found');
            const data = await res.json();

            AppState.activeConversationId = convId;

            // Render existing messages
            DOM.transcriptContainer.innerHTML = '';
            const messages = data.messages || [];

            if (messages.length === 0) {
                renderWelcomeMessage();
            } else {
                messages.forEach(msg => {
                    appendUserMessage(msg.question);
                    appendAssistantMessage(msg.response, msg.mode);
                });
            }

            // Update active state in list
            document.querySelectorAll('.history-item').forEach(el => {
                el.classList.toggle('active', el.dataset.id === convId);
            });

            // Close mobile sidebar if open
            closeSidebar();
        } catch (err) {
            console.error('Failed to switch conversation:', err);
            showTemporaryError('Could not load archived conversation.');
        }
    }

    async function deleteSingleConversation(convId) {
        if (!confirm('Archive this conversation?')) return;
        try {
            const res = await fetch(`/api/conversations/${convId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');

            if (AppState.activeConversationId === convId) {
                startNewConversation();
            } else {
                loadConversationHistory();
            }
        } catch (err) {
            console.error('Error deleting conversation:', err);
            showTemporaryError('Failed to delete conversation.');
        }
    }

    async function clearAllConversations() {
        if (!confirm('Clear all conversation history? This cannot be undone.')) return;
        try {
            await fetch('/api/conversations', { method: 'DELETE' });
            startNewConversation();
        } catch (err) {
            console.error('Error clearing history:', err);
            showTemporaryError('Failed to clear conversations.');
        }
    }

    function startNewConversation() {
        stopSpeaking();
        AppState.activeConversationId = null;
        DOM.transcriptContainer.innerHTML = '';
        renderWelcomeMessage();
        loadConversationHistory();
        closeSidebar();
    }

    function renderWelcomeMessage() {
        DOM.transcriptContainer.innerHTML = `
            <div class="message-card message-assistant welcome-card">
                <div class="message-header">
                    <div class="speaker-identity">
                        <span class="speaker-avatar">⚜️</span>
                        <span class="speaker-name">TimeTravel Companion</span>
                    </div>
                    <span class="mode-pill pill-guide">Museum Guide</span>
                </div>
                <div class="message-body">
                    <p>Greetings, seeker of time and lore! I am your <strong>TimeTravel Voice Companion</strong>.</p>
                    <p>Click <strong>Start Listening</strong> to speak aloud or type your question below. Ask me about the architectural genius of Hampi, the impregnable defenses of Daulatabad Fort, ancient trade routes, or great dynasties of the past.</p>
                </div>
            </div>
        `;
    }

    /* ==========================================================================
       6. Event Handlers & User Interactions
       ========================================================================== */

    function setupEventListeners() {
        // Voice controls
        DOM.startListeningBtn.addEventListener('click', () => {
            stopSpeaking();
            if (AppState.recognition) {
                try {
                    AppState.recognition.start();
                } catch (e) {
                    console.warn('Recognition already active or failed:', e);
                }
            }
        });

        DOM.stopListeningBtn.addEventListener('click', () => {
            if (AppState.recognition) {
                AppState.recognition.stop();
            }
            resetVoiceButtons();
            setVoiceState('IDLE');
        });

        DOM.stopSpeakingBtn.addEventListener('click', () => {
            stopSpeaking();
        });

        // Click Orb to toggle voice listening
        DOM.orbContainer.addEventListener('click', () => {
            if (AppState.voiceState === 'SPEAKING') {
                stopSpeaking();
            } else if (AppState.voiceState === 'LISTENING') {
                if (AppState.recognition) AppState.recognition.stop();
                resetVoiceButtons();
                setVoiceState('IDLE');
            } else if (AppState.voiceState === 'IDLE' && AppState.speechSupported) {
                DOM.startListeningBtn.click();
            }
        });

        // Form submission
        DOM.questionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitQuestion();
        });

        // Keypress (Enter without shift submits, Shift+Enter for newline)
        DOM.questionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitQuestion();
            }
        });

        DOM.questionInput.addEventListener('input', () => {
            updateCharCount();
        });

        // Suggested question chips
        DOM.suggestedChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const q = chip.dataset.question;
                if (q) {
                    stopSpeaking();
                    submitQuestion(q);
                }
            });
        });

        // Clear active transcript
        DOM.clearActiveChatBtn.addEventListener('click', () => {
            stopSpeaking();
            renderWelcomeMessage();
        });

        // Sidebar interactions
        DOM.toggleSidebarBtn.addEventListener('click', openSidebar);
        DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
        DOM.sidebarOverlay.addEventListener('click', closeSidebar);
        DOM.newChatBtn.addEventListener('click', startNewConversation);
        DOM.clearAllHistoryBtn.addEventListener('click', clearAllConversations);
    }

    function openSidebar() {
        DOM.historySidebar.classList.add('open');
        DOM.sidebarOverlay.classList.add('active');
    }

    function closeSidebar() {
        DOM.historySidebar.classList.remove('open');
        DOM.sidebarOverlay.classList.remove('active');
    }

    /* ==========================================================================
       7. Initialization
       ========================================================================== */

    function init() {
        initSpeechRecognition();
        initSpeechSynthesis();
        setupEventListeners();
        checkBackendHealth();
        loadConversationHistory();
        updateCharCount();

        // Periodic health check every 45s
        setInterval(checkBackendHealth, 45000);
    }

    // Launch on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
