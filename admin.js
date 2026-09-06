import {db,collection,doc,getDoc,getDocs,query,where,updateDoc,addDoc,serverTimestamp,runTransaction} from "./firebase.js";

let adminUser=null;
const toast=(m,t="success")=>{const x=document.createElement("div");x.className=`toast ${t==="error"?"bg-red-600":"bg-green-600"} text-white`;x.textContent=m;document.getElementById("toastContainer").appendChild(x);setTimeout(()=>x.remove(),3500)};
const money=n=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function findUser(username){const s=await getDocs(query(collection(db,"users"),where("username","==",username)));return s.empty?null:{id:s.docs[0].id,...s.docs[0].data()}}
window.adminLogin=async()=>{
 try{
  const u=await findUser(document.getElementById("adminUsername").value.trim()),p=document.getElementById("adminPassword").value;
  if(!u||!u.isAdmin||u.passwordHash!==btoa(unescape(encodeURIComponent(p))))throw Error("Invalid admin credentials.");
  adminUser=u;sessionStorage.setItem("nv_admin",u.id);showAdmin();loadAdminData();
 }catch(e){toast(e.message,"error")}
};
function showAdmin(){document.getElementById("adminLogin").classList.add("hidden");document.getElementById("adminPanel").classList.remove("hidden")}
window.adminLogout=()=>{sessionStorage.removeItem("nv_admin");location.reload()};

async function loadAdminData(){
 const [us,ds,ws,ss]=await Promise.all([
  getDocs(collection(db,"users")),getDocs(query(collection(db,"investments"),where("status","==","pending"))),
  getDocs(query(collection(db,"withdrawals"),where("status","==","pending"))),getDoc(doc(db,"settings","main"))
 ]);
 document.getElementById("statUsers").textContent=us.size;document.getElementById("statDeposits").textContent=ds.size;document.getElementById("statWithdrawals").textContent=ws.size;
 const settings=ss.exists()?ss.data():{feePercent:2,feePerNaira:0,referralPercent:5};
 document.getElementById("adminFeePercent").value=settings.feePercent;document.getElementById("adminFeePerNaira").value=settings.feePerNaira;document.getElementById("adminReferralPercent").value=settings.referralPercent;
 document.getElementById("pendingDepositsList").innerHTML=ds.docs.map(d=>{const x={id:d.id,...d.data()};return `<div class="glass-light rounded-xl p-4 mb-3"><b>${esc(x.username||x.userId)}</b><p>${esc(x.planName)} — ${money(x.amount)} — ${esc(x.reference)}</p><div class="flex gap-2 mt-3"><button onclick="approveDeposit('${x.id}')" class="px-3 py-2 gold-btn rounded">Approve</button><button onclick="rejectDeposit('${x.id}')" class="px-3 py-2 border border-red-400/30 text-red-400 rounded">Reject</button></div></div>`}).join("")||'<p class="text-gray-500">No pending deposits.</p>';
 document.getElementById("withdrawalRequestsList").innerHTML=ws.docs.map(d=>{const x={id:d.id,...d.data()};return `<div class="glass-light rounded-xl p-4 mb-3"><b>${esc(x.username)}</b><p>${money(x.amount)} → ${esc(x.bank)} / ${esc(x.account)}</p><div class="flex gap-2 mt-3"><button onclick="approveWithdrawal('${x.id}')" class="px-3 py-2 gold-btn rounded">Approve</button><button onclick="rejectWithdrawal('${x.id}')" class="px-3 py-2 border border-red-400/30 text-red-400 rounded">Reject</button></div></div>`}).join("")||'<p class="text-gray-500">No withdrawal requests.</p>';
 document.getElementById("allUsersList").innerHTML=us.docs.map(d=>{const x=d.data();return `<div class="border-b border-nborder py-3"><b>${esc(x.username)}</b> <span class="text-gray-500">${esc(x.fullName||"")}</span><span class="float-right">${money(x.balance)}</span></div>`}).join("");
}
window.saveAdminSettings=async()=>{await updateDoc(doc(db,"settings","main"),{feePercent:Number(adminFeePercent.value),feePerNaira:Number(adminFeePerNaira.value),referralPercent:Number(adminReferralPercent.value)}).catch(async()=>{await import("./firebase.js").then(m=>m.setDoc(doc(db,"settings","main"),{feePercent:Number(adminFeePercent.value),feePerNaira:Number(adminFeePerNaira.value),referralPercent:Number(adminReferralPercent.value)}))});toast("Settings saved.");loadAdminData()};

window.approveDeposit=async id=>{
 const inv=await getDoc(doc(db,"investments",id));if(!inv.exists())return;const x=inv.data();if(x.status!=="pending")return;
 await runTransaction(db,async tx=>{const uref=doc(db,"users",x.userId),us=await tx.get(uref);if(!us.exists())throw Error("User missing");tx.update(uref,{balance:Number(us.data().balance||0)+Number(x.amount)});tx.update(doc(db,"investments",id),{status:"active",approvedAt:serverTimestamp()})});
 await addDoc(collection(db,"transactions"),{userId:x.userId,type:"deposit_approved",amount:x.amount,status:"approved",reference:x.reference||id,createdAt:serverTimestamp()});toast("Deposit approved.");loadAdminData();
};
window.rejectDeposit=async id=>{await updateDoc(doc(db,"investments",id),{status:"rejected",rejectedAt:serverTimestamp()});toast("Deposit rejected.");loadAdminData()};
window.approveWithdrawal=async id=>{
 const w=await getDoc(doc(db,"withdrawals",id));if(!w.exists())return;const x=w.data();if(x.status!=="pending")return;
 await runTransaction(db,async tx=>{const uref=doc(db,"users",x.userId),us=await tx.get(uref);const bal=Number(us.data().balance||0);if(bal<x.amount)throw Error("User balance is insufficient.");tx.update(uref,{balance:bal-Number(x.amount)});tx.update(doc(db,"withdrawals",id),{status:"approved",approvedAt:serverTimestamp()})});
 await addDoc(collection(db,"transactions"),{userId:x.userId,type:"withdrawal_approved",amount:x.amount,status:"approved",reference:id,createdAt:serverTimestamp()});toast("Withdrawal approved.");loadAdminData();
};
window.rejectWithdrawal=async id=>{await updateDoc(doc(db,"withdrawals",id),{status:"rejected",rejectedAt:serverTimestamp()});toast("Withdrawal rejected.");loadAdminData()};

(async()=>{const id=sessionStorage.getItem("nv_admin");if(id){const s=await getDoc(doc(db,"users",id));if(s.exists()&&s.data().isAdmin){adminUser={id,...s.data()};showAdmin();loadAdminData()}}})();
