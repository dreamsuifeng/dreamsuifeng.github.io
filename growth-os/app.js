"use strict";
const taskLabels={course:"课程学习",reading:"教材阅读",assignment:"实践作业",startup_research:"创业研究",outreach:"约聊行动"};
const views={dashboard:"成长总览",plan:"26 周学习路线",companies:"AI 创业机会库",networking:"约聊与人脉",reviews:"每周复盘"};
const state={tab:"dashboard",month:"all",data:null};
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pct=(a,b)=>b?Math.round(a/b*100):0;
const progress=(week)=>{const checks=state.data?.progress?.checks?.[week.id]||{};return Object.keys(taskLabels).filter(k=>checks[k]===true).length};
const count=()=>{const weeks=state.data?.curriculum?.weeks||[];return weeks.reduce((s,w)=>s+progress(w),0)};
const bar=(value)=>'<div class="bar"><div class="fill" style="width:'+Math.max(0,Math.min(100,value))+'%"></div></div>';
const card=(label,value,sub)=>'<div class="card"><div class="muted">'+label+'</div><div class="big">'+value+'</div><div class="muted">'+sub+'</div></div>';
async function load(){
 $("status").textContent="正在读取数据文件…";$("status").classList.remove("err");
 try{
  const paths=["data/curriculum.json","data/progress.json","data/startups.json","data/networking.json","data/reviews.json"];
  const content=await Promise.all(paths.map(async p=>{const r=await fetch(p+"?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error(p+": HTTP "+r.status);return r.json()}));
  state.data={curriculum:content[0],progress:content[1],startups:content[2],networking:content[3],reviews:content[4]};
  $("status").textContent="只读视图 · 数据由 GitHub 中的 JSON 文件管理；修改进度请告诉 ChatGPT，由它提交 GitHub。";
 }catch(e){$("status").textContent="无法读取 JSON 文件："+e.message+"。如果在本地打开，请先运行 python -m http.server 8000，然后访问 http://localhost:8000。";$("status").classList.add("err");return}
 render();
}
function render(){
 if(!state.data)return;
 $("title").textContent=views[state.tab];
 document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.tab===state.tab));
 const root=$("content");
 root.innerHTML=({dashboard:renderDashboard,plan:renderPlan,companies:renderCompanies,networking:renderNetworking,reviews:renderReviews})[state.tab]();
 if(state.tab==="plan"){$("filterMonth").value=state.month;$("filterMonth").addEventListener("change",e=>{state.month=e.target.value;render()})}
}
function renderDashboard(){
 const w=state.data.curriculum.weeks,done=count(),total=w.length*Object.keys(taskLabels).length;
 const startups=state.data.startups.companies||[],contacts=state.data.networking.contacts||[],reviews=state.data.reviews.reviews||[];
 const today=new Date().toISOString().slice(0,10);const active=w.find(x=>x.start<=today&&x.end>=today)||w.find(x=>progress(x)<5)||w[w.length-1];
 const months=[...new Set(w.map(x=>x.phase))];
 return '<div class="stats">'+card("学习完成率",pct(done,total)+"%",done+"/"+total+" 项任务")+card("创业研究",startups.length,"家已记录公司")+card("约聊记录",contacts.length,"位联系人")+card("每周复盘",reviews.length,"份复盘")+'</div>'+
 '<div class="grid"><section class="panel"><h2>阶段完成率</h2>'+months.map(m=>{const a=w.filter(x=>x.phase===m);const p=pct(a.reduce((s,x)=>s+progress(x),0),a.length*5);return '<div class="month"><div class="linehead"><b>'+esc(m)+'</b><span>'+p+'%</span></div>'+bar(p)+'</div>'}).join("")+'</section>'+
 '<section class="panel"><h2>当前 / 下一学习周</h2><div class="week"><strong>'+esc(active.id)+" · "+esc(active.title)+'</strong><p class="muted">'+esc(active.start)+"—"+esc(active.end)+'</p><p class="small">'+esc(active.topics)+'</p>'+bar(pct(progress(active),5))+'<div class="checks">'+Object.keys(taskLabels).map(k=>'<div class="check '+((state.data.progress.checks?.[active.id]||{})[k]?'done':'')+'">'+((state.data.progress.checks?.[active.id]||{})[k]?'✓':'○')+' '+taskLabels[k]+'</div>').join("")+'</div></div><p class="notice">请在 ChatGPT 中发送：完成了 '+esc(active.id)+' 的课程和阅读，更新 GitHub。</p></section></div>';
}
function renderPlan(){
 const weeks=state.data.curriculum.weeks;
 const filter='<div class="filters"><select id="filterMonth"><option value="all">全部阶段</option>'+[...new Set(weeks.map(w=>w.phase))].map(p=>'<option value="'+esc(p)+'">'+esc(p)+'</option>').join("")+'</select></div>';
 const data=state.month==="all"?weeks:weeks.filter(w=>w.phase===state.month);
 return filter+'<div class="panel"><div class="tablewrap"><table class="table"><thead><tr><th>周次</th><th>时间</th><th>课程 / 教材</th><th>作业 / 创业研究 / 约聊</th><th>完成率</th></tr></thead><tbody>'+data.map(w=>'<tr><td><b>'+esc(w.id)+'</b><p><span class="tag">'+esc(w.phase)+'</span></p></td><td>'+esc(w.start)+'<br>'+esc(w.end)+'</td><td><strong>'+esc(w.title)+'</strong><p class="small">'+esc(w.topics)+'</p><p class="muted">'+esc(w.book)+'<br>'+esc(w.course)+'</p></td><td class="small"><b>作业：</b>'+esc(w.assignment)+'<br><b>研究：</b>'+esc(w.startup_research)+'<br><b>约聊：</b>'+esc(w.outreach)+'</td><td><b>'+pct(progress(w),5)+'%</b><div style="min-width:80px;margin-top:7px">'+bar(pct(progress(w),5))+'</div></td></tr>').join("")+'</tbody></table></div></div>';
}
function renderCompanies(){
 const items=state.data.startups.companies||[];
 return '<div class="panel"><h2>AI 创业公司研究</h2>'+(!items.length?'<div class="empty">尚未记录公司。可在 ChatGPT 中说「把这家公司加入成长 OS 创业库」。</div>':'<div class="tablewrap"><table class="table"><thead><tr><th>公司</th><th>赛道 / 轮次</th><th>判断</th><th>进展与来源</th></tr></thead><tbody>'+items.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.sector||"")+'<br>'+esc(x.round||"")+'</td><td>'+esc(x.notes||x.thesis||"")+'</td><td>'+esc(x.next_action||x.next||"")+(x.source_url?'<br><a href="'+encodeURI(x.source_url).replace(/"/g,"")+'" rel="noopener noreferrer" target="_blank">查看来源</a>':"")+'</td></tr>').join("")+'</tbody></table></div>')+'</div>';
}
function renderNetworking(){
 const items=state.data.networking.contacts||[];
 return '<div class="panel"><h2>联系与约聊记录</h2>'+(!items.length?'<div class="empty">暂无记录。私有联系人只保存在 GitHub Private 仓库。</div>':'<div class="tablewrap"><table class="table"><thead><tr><th>联系人</th><th>机构 / 公司</th><th>状态</th><th>下一步</th></tr></thead><tbody>'+items.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.company||"")+'</td><td>'+esc(x.status||"")+'</td><td>'+esc(x.next_action||x.next||"")+'</td></tr>').join("")+'</tbody></table></div>')+'</div>';
}
function renderReviews(){
 const items=state.data.reviews.reviews||[];
 return '<div class="panel"><h2>每周学习复盘</h2>'+(!items.length?'<div class="empty">暂无记录。每周日告诉 ChatGPT「记录本周复盘」，即可更新 GitHub。</div>':items.map(x=>'<div class="week"><strong>'+esc(x.week||x.id||"")+'</strong><p class="small">'+esc(x.summary||x.learn||"")+'</p></div>').join(""))+'</div>';
}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>{state.tab=b.dataset.tab;render()}));
$("refresh").addEventListener("click",load);
load();
