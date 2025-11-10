document.addEventListener('DOMContentLoaded',()=>{

  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  const closeButtons = document.querySelectorAll('[data-close]');

  function openModal(modal){
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(modal){
    modal.setAttribute('aria-hidden','true');
  }

  loginBtn.addEventListener('click',()=>openModal(loginModal));
  signupBtn.addEventListener('click',()=>openModal(signupModal));
  closeButtons.forEach(btn => btn.addEventListener('click', e=>{
    const modal = e.target.closest('.modal');
    if(modal) closeModal(modal);
  }));
  // Close on backdrop click
  document.querySelectorAll('.modal').forEach(m=>{
    m.addEventListener('click', e=>{
      if(e.target === m) closeModal(m);
    });
  });

  // Simulate API request
  const sendSample = document.getElementById('sendSample');
  const sampleResponse = document.getElementById('sampleResponse');

  sendSample.addEventListener('click', ()=>{
    const simulated = {
      risk_score: 58,
      recommended_action: "CHALLENGE",
      breakdown: {
        ip_score: 20,
        velocity_score: 10,
        fingerprint_score: 8,
        behavior_score: 20
      }
    };
    sampleResponse.textContent = JSON.stringify(simulated, null, 2);
    sendSample.textContent = 'Simulated';
    setTimeout(()=> sendSample.textContent = 'Simulate Request', 1500);
  });

  // Forms are demo-only — prevent submission
  document.querySelectorAll('form').forEach(f=>f.addEventListener('submit', e=>{ e.preventDefault(); alert('Demo only: no backend in this static site.'); }));

});
