
    // Function to show invalid ID message and redirect
    function showInvalidIdMessage() {
      // Create error message element
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.innerHTML = `
        <h3>Invalid Stream ID</h3>
        <p>Sorry, the stream you're trying to access is not available or the ID is incorrect.</p>
        <p>Redirecting to our Telegram channel in <span class="error-countdown">5</span> seconds...</p>
      `;
      
      document.body.appendChild(errorDiv);
      
      // Countdown and redirect
      let countdown = 5;
      const countdownElement = errorDiv.querySelector('.error-countdown');
      
      const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          window.location.href = 'https://t.me/cine_arena';
        }
      }, 1000);
    }

    // // Modal functionality
    // (function(){
    //   const modal = document.getElementById('skpop');
    //   const closeBtn = document.getElementById('closeModal');
    //   const joinBtn = document.getElementById('joinChannel');
    //   const alreadyBtn = document.getElementById('alreadyJoined');
      
    //   function showModal(){ 
    //     modal.classList.add('show'); 
    //     modal.setAttribute('aria-hidden','false'); 
    //   }
      
    //   function hideModal(){ 
    //     modal.classList.remove('show'); 
    //     modal.setAttribute('aria-hidden','true'); 
    //   }
      
    //   closeBtn.addEventListener('click', hideModal);
    //   alreadyBtn.addEventListener('click', hideModal);
    //   joinBtn.addEventListener('click', function(){ 
    //     window.open('https://t.me/cine_arena','_blank'); 
    //     hideModal(); 
    //   });
      
    //   setTimeout(showModal, 700);
    // })();

    // Social media sharing functionality
    document.addEventListener('DOMContentLoaded', function() {
      const currentUrl = encodeURIComponent(window.location.href);
      const pageTitle = encodeURIComponent("Cine Arena 🏏 Watch Now!");
      const shareText = encodeURIComponent("🚨 LIVE CRICKET STREAMING 🚨\n\nWatch Cine Arena live stream now!\n\n");
      
      // WhatsApp
      document.querySelector('.social-icon.whatsapp').addEventListener('click', function(e) {
        e.preventDefault();
        window.open(`https://api.whatsapp.com/send?text=${shareText}${currentUrl}`, '_blank');
      });
      
      // Telegram
      document.querySelector('.social-icon.telegram').addEventListener('click', function(e) {
        e.preventDefault();
        window.open(`https://t.me/share/url?url=${currentUrl}&text=${shareText}`, '_blank');
      });
      
      // Facebook
      document.querySelector('.social-icon.facebook').addEventListener('click', function(e) {
        e.preventDefault();
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}&quote=${shareText}`, '_blank');
      });
      
      // Instagram (can't share directly, so open in new tab)
      document.querySelector('.social-icon.instagram').addEventListener('click', function(e) {
        e.preventDefault();
        window.open('https://www.instagram.com/', '_blank');
      });

      // Share Button functionality
      document.getElementById('sharePageBtn').addEventListener('click', function() {
        const shareData = {
          title: 'Cine Arena',
          text: 'Watch Cine Arena live stream now!',
          url: window.location.href
        };

        if (navigator.share) {
          navigator.share(shareData)
            .then(() => console.log('Shared successfully'))
            .catch((error) => console.log('Error sharing:', error));
        } else {
          // Fallback: Copy to clipboard
          navigator.clipboard.writeText(window.location.href)
            .then(() => {
              alert('Stream link copied to clipboard! 📋\n\nShare it with your friends to watch together!');
            })
            .catch(() => {
              // Fallback for older browsers
              const tempInput = document.createElement('input');
              tempInput.value = window.location.href;
              document.body.appendChild(tempInput);
              tempInput.select();
              document.execCommand('copy');
              document.body.removeChild(tempInput);
              alert('Stream link copied to clipboard! 📋\n\nShare it with your friends to watch together!');
            });
        }
      });
    });

    // Shaka Player initialization - Now with PiP button
    (async function(){
      try {
        // Check for invalid ID immediately
        const params = new URLSearchParams(window.location.search);
        const idParam = params.get('id');
        
        // If no ID parameter or ID is explicitly invalid, show error immediately
        if (!idParam || idParam === 'invalid') {
          showInvalidIdMessage();
          return;
        }

        // Wait for Shaka to be available
        if (typeof shaka === 'undefined') {
          console.error('Shaka Player not loaded');
          return;
        }

        shaka.polyfill.installAll();
        
        if (!shaka.Player.isBrowserSupported()) {
          console.warn('Shaka not supported');
          return;
        }

        const video = document.getElementById('video');
        const container = document.querySelector('[data-shaka-player-container]');
        
        if (!video || !container) {
          console.error('Video element or container not found');
          return;
        }

        const player = new shaka.Player(video); 
        const ui = new shaka.ui.Overlay(player, container, video);
        
        // Configure UI with Picture-in-Picture button
        const uiConfig = {
          controlPanelElements: [
            'play_pause',
			'mute',
            'volume',
            'time_and_duration',
            'spacer',
			'picture_in_picture',
            'overflow_menu',
			'fullscreen'
          ],
          addSeekBar: true,
          seekBarColors: {
            base: 'rgba(255, 255, 255, 0.3)',
            buffered: 'rgba(255, 255, 255, 0.5)',
            played: 'rgba(51, 204, 255, 0.9)',
          },
		  volumeBarColors: {
            base: 'rgba(255, 255, 255, 0.3)',
            level: 'rgba(51, 204, 255, 0.9)',
          }
        };

        // Apply UI configuration
        ui.configure(uiConfig);

        // Simple player configuration
        player.configure({
          streaming: {
            bufferingGoal: 30
          }
        });

        // fetch-based loader
        const _cache = new Map();
        async function fetchStreamData(id){
          const key = `stream-${id}`;
          const c = _cache.get(key);
          if(c && Date.now()-c.ts < 3e5) return c.val;
          try{
            const controller = new AbortController();
            const timeout = setTimeout(()=>controller.abort(), 3000); // Reduced timeout
            const res = await fetch('https://sktechapi.saqlainhaider8198.workers.dev', { signal: controller.signal });
            clearTimeout(timeout);
            if(!res.ok) throw new Error('API status:'+res.status);
            const json = await res.json();
            const item = (json.data||[]).find(i=>String(i.id)===String(id));
            _cache.set(key, { val:item||null, ts:Date.now() });
            return item||null;
          }catch(err){ 
            console.error('Fetch error', err); 
            return null; 
          }
        }

        const manifestParam = params.get('manifest');

        let payload = null;
        if(manifestParam){ 
          payload = { manifest: manifestParam, title: 'Manual manifest' }; 
        } else { 
          payload = await fetchStreamData(idParam); 
        }

        if(!payload){ 
          console.warn('Unable to fetch stream metadata.');
          showInvalidIdMessage();
          return; 
        }

        const manifestUrl = payload.mpdLink || payload.manifest || payload.url || payload.stream || payload.hls || payload.manifestUrl || null;
        const clearkey = payload.clearkey || payload.clearkeys || payload.i || payload.clearKeys || payload.keys || {};

        if(clearkey && (clearkey.keyId || clearkey.key_id) && (clearkey.key || clearkey.keyvalue)){
          try{ 
            const kid = clearkey.keyId || clearkey.key_id; 
            const key = clearkey.key || clearkey.keyvalue; 
            const ck = {}; 
            ck[kid] = key; 
            player.configure({ drm: { clearKeys: ck } }); 
            console.info('Configured clearKeys'); 
          } catch(e){ 
            console.warn('clearKey config failed', e); 
          }
        }

        if(!manifestUrl){ 
          console.warn('Payload did not include a valid manifest URL.');
          showInvalidIdMessage();
          return; 
        }

        async function tryLoad(url, attempts=1){ // Reduced attempts
          for(let i=0; i<=attempts; i++){ 
            try{ 
              await player.load(url); 
              console.info('Loaded manifest:', url); 
              return true; 
            } catch(err){ 
              console.warn('Load attempt '+(i+1)+' failed', err); 
              if(i===attempts) return false; 
              await new Promise(r => setTimeout(r, 500)); // Reduced delay
            } 
          } 
          return false; 
        }

        const ok = await tryLoad(manifestUrl, 1); // Only one attempt
        
        if(!ok){ 
          console.warn('Failed to load stream.');
          showInvalidIdMessage();
          return; 
        }

        // Logo show/hide behavior
        (function(){
          const logo = document.querySelector('.player-logo');
          if(!logo) return;
          
          let showTimer = null; 
          let hoverReady = false;
          
          const initialDelay = 1500;
          
          function hideLogo(){ 
            logo.style.opacity = '0'; 
            logo.style.pointerEvents = 'none'; 
          }
          
          function showLogo(){ 
            logo.style.opacity = '1'; 
            logo.style.pointerEvents = 'auto'; 
            if(showTimer) clearTimeout(showTimer); 
            showTimer = setTimeout(() => { hideLogo(); }, 3000); 
          }
          
          setTimeout(() => { 
            hoverReady = true; 
            showLogo(); 
          }, initialDelay);
          
          const containerEl = document.querySelector('.video-container');
          if(containerEl){ 
            containerEl.addEventListener('mousemove', function(){ 
              if(hoverReady) showLogo(); 
            }, { passive:true }); 
            
            containerEl.addEventListener('mouseleave', function(){ 
              if(hoverReady) hideLogo(); 
            }, { passive:true }); 
          }
        })();

        player.addEventListener('error', function(ev){ 
          console.error('Shaka error', ev); 
        });

      } catch(e){ 
        console.error('Shaka init failed', e); 
        showInvalidIdMessage();
      }
    })();
  
