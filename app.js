import {
 db,collection,doc,setDoc,getDoc,getDocs,updateDoc,onSnapshot,query,where,orderBy,addDoc,serverTimestamp,increment,runTransaction
} from "./firebase.js";

const PLANS=[
{id:"p1",name:"Starter Plan",amount:10000,returns:27000,days:30,roi:170},
{id:"p2",name:"Bronze Plan",amount:18000,returns:38500,days:30,roi:114},
{id:"p3",name:"Silver Plan",amount:36000,returns:82800,days:45,roi:130},
{id:"p4",name:"Gold Plan",amount:50000,returns:125000,days:45,roi:150},
{id:"p5",name:"Platinum Plan",amount:70000,returns:182000,days:60,roi:160},
{id:"p6",name:"Diamond Plan",amount:84000,returns:226800,days:60,roi:170},
{id:"p7",name:"Premium Plan",amount:125000,returns:350000,days:60,roi:180},
{id:"p8",name:"Executive Plan",amount:165000,returns:478500,days:75,roi:190},
{id:"p9",name:"Elite Plan",amount:200000,returns:600000,days:75,roi:200},
{id:"p10",name:"Royal Plan",amount:250000,returns:775000,days:90,roi:210},
{id:"p11",name:"Imperial Plan",amount:350000,returns:1120000,days:90,roi:220},
{id:"p12",name:"Sovereign Plan",amount:410000,returns:1353000,days:90,roi:230},
{id:"p13",name:"Crown Plan",amount:500000,returns:1700000,days:105,roi:240},
{id:"p14",name:"Monarch Plan",amount:750000,returns:2625000,days:120,roi:250},
{id:"p15",name:"Legend Plan",amount:1000000,returns:3700000,days:120,roi:270},
{id:"p16",name:"Titan Plan",amount:2000000,returns:8000000,days:150,roi:300},
{id:"p17",name:"Oracle Plan",amount:3500000,returns:14700000,days:180,roi:320},
{id:"p18",name:"Supreme Plan",amount:5000000,returns:22000000,days:210,roi:340},
{id:"p19",name:"Ultimate Plan",amount:10000000,returns:46000000,days:270,roi:360},
{id:"p20",name:"Zenith Plan",amount:20000000,returns:96000000,days:365,roi:380}
];
window.PLANS=PLANS;
let currentUser=null,authMode="login",selectedPlanId=null;
let unsubUser=null,unsubInv=null,unsubTx=null;

const money=n=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast=(m,t="success")=>{const x=document.createElement("div");x.className=`toast ${t==="error"?"bg-red-600":"bg-green-600"} text-white`;x.textContent=m;document.getElementById("toastContainer").appendChild(x);setTimeout(()=>x.remove(),3500)};
window.showToast=toast;

function renderPlans(){
 const html=PLANS.map(p=>`<div class="plan-card glass rounded-2xl p-5 border border-nborder" onclick="selectPlan('${p.id}','landing')">
 <h3 class="text-lg font-bold text-white">${esc(p.name)}</h3>
 <p class="text-2xl font-black gold-gradient my-2">${money(p.amount)}</p>
 <p class="text-gray-400 text-sm">Return: <b class="text-green-400">${money(p.returns)}</b></p>
 <p class="text-gray-400 text-sm">${p.days} days • ${p.roi}% stated ROI</p>
 </div>`).join("");
 document.getElementById("plansGrid").innerHTML=html;
 document.getElementById("investPlansGrid").innerHTML=html.replaceAll("onclick=\"selectPlan('","onclick=\"selectPlan('");
}
window.renderPlans=renderPlans;

window.openAuth=mode=>{authMode=mode;document.getElementById("authModal").classList.remove("hidden");document.getElementById("authModalTitle").textContent=mode==="login"?"Login":"Create Account";document.getElementById("authSubmitBtn").textContent=mode==="login"?"Login":"Register";document.getElementById("registerFields").classList.toggle("hidden",mode==="login");document.getElementById("authToggleText").textContent=mode==="login"?"Don't have an account?":"Already have an account?";document.getElementById("authToggleBtn").textContent=mode==="login"?"Register":"Login"};
window.closeAuth=()=>document.getElementById("authModal").classList.add("hidden");
window.toggleAuthMode=()=>window.openAuth(authMode==="login"?"register":"login");

function code(){return "NV"+Math.random().toString(36).slice(2,8).toUpperCase()}
async function findUser(username){
 const s=await getDocs(query(collection(db,"users"),where("username","==",username)));
 return s.empty?null:{id:s.docs[0].id,...s.docs[0].data()};
}
async function loginUser(username,password){
 const u=await findUser(username);
 if(!u||u.passwordHash!==btoa(unescape(encodeURIComponent(password)))) throw Error("Invalid username or password.");
 currentUser=u;localStorage.setItem("nv_user",u.id);showDashboard();loadUserData();
}
async function registerUser(username,password,fullName,email,ref){
 if(username.length<3||password.length<6)throw Error("Username must be 3+ characters and password 6+ characters.");
 if(await findUser(username))throw Error("Username already exists.");
 const id=crypto.randomUUID(), referralCode=code();
 let referredBy=null;
 if(ref){const r=await getDocs(query(collection(db,"users"),where("referralCode","==",ref.trim())));if(!r.empty)referredBy=r.docs[0].id}
 const user={username,fullName:fullName||username,email:email||"",passwordHash:btoa(unescape(encodeURIComponent(password))),balance:0,referralBalance:0,totalReferralEarnings:0,referralCode,referredBy,isAdmin:false,createdAt:serverTimestamp()};
 await setDoc(doc(db,"users",id),user);
 currentUser={id,...user};localStorage.setItem("nv_user",id);window.closeAuth();showDashboard();loadUserData();toast("Account created.");
}
window.handleAuth=async e=>{e.preventDefault();try{const u=document.getElementById("authUsername").value.trim(),p=document.getElementById("authPassword").value;if(authMode==="login")await loginUser(u,p);else await registerUser(u,p,document.getElementById("authFullName").value.trim(),document.getElementById("authEmail").value.trim(),document.getElementById("authReferral").value.trim())}catch(e){toast(e.message||"Operation failed","error")}};

function showDashboard(){document.getElementById("landingPage").classList.add("hidden");document.getElementById("dashboard").classList.remove("hidden");document.getElementById("userNameDisplay").textContent=currentUser.fullName||currentUser.username}
function cleanup(){[unsubUser,unsubInv,unsubTx].forEach(x=>x&&x());unsubUser=unsubInv=unsubTx=null}
window.logout=()=>{cleanup();currentUser=null;localStorage.removeItem("nv_user");document.getElementById("dashboard").classList.add("hidden");document.getElementById("landingPage").classList.remove("hidden")};

function loadUserData(){
 if(!currentUser)return;
 const uid=currentUser.id;
 unsubUser=onSnapshot(doc(db,"users",uid),s=>{if(!s.exists())return;currentUser={id:uid,...s.data()};document.getElementById("overviewBalance").textContent=money(currentUser.balance);document.getElementById("overviewRefBalance").textContent=money(currentUser.referralBalance);document.getElementById("totalReferralEarnings").textContent=money(currentUser.totalReferralEarnings);document.getElementById("referralCodeDisplay").value=currentUser.referralCode||"";document.getElementById("referralLink").value=`${location.origin}${location.pathname}?ref=${currentUser.referralCode||""}`});
 unsubInv=onSnapshot(query(collection(db,"investments"),where("userId","==",uid)),s=>{const a=s.docs.map(d=>({id:d.id,...d.data()}));document.getElementById("overviewActiveInvestments").textContent=a.filter(x=>x.status==="active"||x.status==="pending").length;document.getElementById("activeInvestmentsList").innerHTML=a.length?a.map(x=>`<div class="glass-light rounded-xl p-4"><div class="flex justify-between"><b>${esc(x.planName)}</b><span>${esc(x.status)}</span></div><p class="text-sm text-gray-400">${money(x.amount)} → ${money(x.returnAmount)}</p></div>`).join(""):`<p class="text-gray-500 text-center py-4">No investments yet.</p>`});
 unsubTx=onSnapshot(query(collection(db,"transactions"),where("userId","==",uid)),s=>renderTransactions(s.docs.map(d=>({id:d.id,...d.data()}))));
}
function renderTransactions(txs){txs.sort((a,b)=>String(b.createdAt?.seconds||"").localeCompare(String(a.createdAt?.seconds||"")));document.getElementById("transactionsTableBody").innerHTML=txs.map(t=>`<tr class="border-b border-nborder"><td class="p-2">${esc(t.type)}</td><td class="p-2">${money(t.amount)}</td><td class="p-2">${esc(t.status)}</td><td class="p-2">${t.createdAt?.toDate?t.createdAt.toDate().toLocaleString():"Pending"}</td><td class="p-2">${esc(t.reference||t.id)}</td></tr>`).join("");document.getElementById("noTransactions").classList.toggle("hidden",txs.length>0)}
window.renderTransactions=renderTransactions;

window.selectPlan=(id)=>{selectedPlanId=id;const p=PLANS.find(x=>x.id===id);document.getElementById("investModal").classList.remove("hidden");document.getElementById("investModalContent").innerHTML=`<p class="text-white font-bold">${esc(p.name)}</p><p class="text-gray-400 my-2">Amount: ${money(p.amount)}</p><p class="text-gray-400">Return: ${money(p.returns)} over ${p.days} days.</p><p class="text-yellow-400 text-sm mt-4">Only submit a deposit after verifying the platform's official funding details.</p><input id="investmentAmount" type="number" value="${p.amount}" class="my-4"><input id="investmentReference" placeholder="Transaction reference" class="mb-4"><button onclick="submitInvestment()" class="w-full py-3 gold-btn rounded-xl font-bold">Submit Deposit</button>`};
window.closeInvestModal=()=>document.getElementById("investModal").classList.add("hidden");

window.submitInvestment=async()=>{
 if(!currentUser)return;
 const p=PLANS.find(x=>x.id===selectedPlanId),amount=Number(document.getElementById("investmentAmount").value),reference=document.getElementById("investmentReference").value.trim();
 if(amount!==p.amount||!reference){toast("Enter the exact plan amount and a transaction reference.","error");return}
 await addDoc(collection(db,"investments"),{userId:currentUser.id,planId:p.id,planName:p.name,amount,returnAmount:p.returns,days:p.days,roi:p.roi,status:"pending",reference,createdAt:serverTimestamp()});
 await addDoc(collection(db,"transactions"),{userId:currentUser.id,type:"investment_deposit",amount,status:"pending",reference,createdAt:serverTimestamp()});
 window.closeInvestModal();toast("Deposit submitted for review.");
};

window.updateBankFields=()=>{const b=document.getElementById("withdrawBank").value;document.getElementById("vbankFields").classList.toggle("hidden",b!=="VBANK MFB");document.getElementById("otherBankFields").classList.toggle("hidden",!b||b==="VBANK MFB")};
window.submitWithdrawal=async()=>{
 const amount=Number(document.getElementById("withdrawAmount").value),bank=document.getElementById("withdrawBank").value,name=document.getElementById("withdrawAccountName").value.trim();
 const account=bank==="VBANK MFB"?document.getElementById("withdrawVbankId").value.trim():document.getElementById("withdrawAccountNumber").value.trim();
 if(amount<1000||!bank||!name||!account){toast("Complete all withdrawal fields.","error");return}
 if(amount>Number(currentUser.balance||0)){toast("Insufficient balance.","error");return}
 await addDoc(collection(db,"withdrawals"),{userId:currentUser.id,username:currentUser.username,amount,bank,account,name,status:"pending",createdAt:serverTimestamp()});
 await addDoc(collection(db,"transactions"),{userId:currentUser.id,type:"withdrawal",amount,status:"pending",reference:"Withdrawal request",createdAt:serverTimestamp()});
 toast("Withdrawal request submitted.");
};

window.copyReferralLink=async()=>{await navigator.clipboard.writeText(document.getElementById("referralLink").value);toast("Referral link copied.")};
window.switchTab=tab=>{document.querySelectorAll(".tab-content").forEach(x=>x.classList.add("hidden"));document.querySelectorAll(".tab-btn").forEach(x=>x.classList.remove("tab-active"));document.getElementById(`content-${tab}`).classList.remove("hidden");document.getElementById(`tab-${tab}`).classList.add("tab-active")};

async function ensureUserDemo(){
 try{
  const existing=await findUser("danny");
  if(!existing){
   const id=crypto.randomUUID();
   const demo={username:"danny",fullName:"Danny Demo User",email:"",passwordHash:btoa(unescape(encodeURIComponent("danny"))),balance:0,referralBalance:0,totalReferralEarnings:0,referralCode:"NVDANNY",referredBy:null,isAdmin:false,createdAt:serverTimestamp(),isDemo:true};
   await setDoc(doc(db,"users",id),demo);
  }
 }catch(e){console.warn("Demo account initialization skipped:",e)}
}

async function autoLogin(){const id=localStorage.getItem("nv_user");if(!id)return;const s=await getDoc(doc(db,"users",id));if(s.exists()){currentUser={id,...s.data()};showDashboard();loadUserData()}}
renderPlans();ensureUserDemo();autoLogin();
