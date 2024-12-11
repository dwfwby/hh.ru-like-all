let csv = "Ссылка; Название; Оклад; Опыт; Занятость; Формат; Компания; Область; Описание";
const ignore = [];

beforeFlipping(async function(){

    const btns = await getButtons();
    
    if(!btns) return;
    
    for (let btn of btns) {
        const vacancyId = new URL(btn.href).searchParams.get("vacancyId");

        if(ignore.includes(vacancyId))
                continue;
        
        const status = await getType(vacancyId);
        
        if(status != "quickResponse")
            csv += `\n"${(await getVacancyInfo(vacancyId)).join('", "')}"`;

        ignore.push(vacancyId);
    }
    
})

async function beforeFlipping(callback){
    let nextPage;
    
    do {
        await callback();
        
        const page = getCurrentPage();
        nextPage = selectPage(-1);

        if(nextPage){
            nextPage.click();
        
            await isChangedPage(page);
        }
    } while (nextPage)

    download("table.csv", csv);
    alert("finished!")
}

function selectPage(plus = 0){
    const pagination = Array.from(document.querySelectorAll("a[data-qa='pager-page']"));
    const pageNode = document.querySelector(`a[aria-current="true"]`);
    const pageIndex = pagination.indexOf(pageNode);
    const nextPageIndex = pageIndex+plus;
    
    return pagination[nextPageIndex]
}

function isChangedPage(prev){
    return new Promise(resolve => {
        const id = setInterval(() => {
            const page = getCurrentPage();
            
            if(page >= 0 && page != prev){
                clearInterval(id);
                resolve();
            }
        }, 100)
    })
};

function getIndexPage(pageNode){
    const pagination = Array.from(document.querySelectorAll("a[data-qa='pager-page']"));
    return pagination.indexOf(pageNode);
}

function getCurrentPage(){
    return document.querySelector(`a[aria-current="true"]`)?.innerHTML;
}

function getButtons(){
    const lastTime = new Date().getTime();
    
    return new Promise(resolve => {
        const id = setInterval(() => {
            const time = new Date().getTime();
            const btns = document.querySelectorAll(`a[href^="/applicant/vacancy_response"]`);
    
            if(btns.length || time - lastTime >= 5000){
                resolve(btns);
                clearInterval(id);
            }
        }, 100)
    });
}

async function getType(id){
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        
        xhr.open("GET", `https://saratov.hh.ru/applicant/vacancy_response/popup?vacancyId=${id}&isTest=no&withoutTest=no&lux=true&alreadyApplied=false`);
        xhr.responseType = 'json';
        xhr.setRequestHeader("x-hhtmfrom", "vacancy_response");
        xhr.setRequestHeader("x-hhtmsource", "vacancy_search_list");
        xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");
        
        xhr.onloadend = async () => resolve(xhr?.response?.type);
        
        xhr.send();
    })
}

async function applyVacancy(btn){
    const parent = btn.closest('div[data-qa^="vacancy-serp__vacancy"]');

    btn.click();

    return new Promise(resolve => {
        const id = setInterval( () => {
            const relocationConfirm = document.querySelector(`[data-qa="relocation-warning-confirm"]`);
            const closeChatik = document.querySelector(`[data-qa="chatik-close-chatik"]`);
            const status = parent.querySelector(`div[class*="workflow-status-container_mobile--"]`);    
            let isApplied;

            if(status && status.children)
                isApplied = Array.from(status.children).at(-1)?.innerHTML == "Вы откликнулись";
    
            relocationConfirm?.click();
            closeChatik?.click();
            
            if(isApplied){
                clearInterval(id);
                resolve();
            }
        },100);
    });
}

async function getVacancyInfo(id){
    return new Promise(resolve => {
        const url = `https://saratov.hh.ru/vacancy/${id}`;
        const regexpDescription = /(?<=data-qa="vacancy-description">).+?(?=<\/div><\/div><div class="vacancy-section vacancy-section_magritte">)/mg;
        const regexpTitle = /(?<=<h1 data-qa="title"[^>]+?>).+?(?=<\/h1)/mg;
        const regexpSalary = /(?<=<\/h1><\/div><\/div><span[^>]+?>).+?(?=<\/span>)/mg;
        const regexpExperience = /(?<=<span data-qa="vacancy-experience">).+?(?=<\/span>)/mg;
        const regexpShedule = /(?<=График: <!-- -->).+?(?=<\/p)/mg;
        const regexpSkills = /(?<=<li data-qa="skills-element">.*<div class="magritte-tag__label___[^>]*?">).*?(?=<\/div><\/div><\/li>)/mg;
        const regexpEmployer = /(?<=<a data-qa="vacancy-company-name".+magritte-text_typography-title.*">).+?(?=<\/span><\/a><\/span>)/mg;
        const regexpTags = /<[^>]+>/g;
        
        fetch(url).then(async r => {
            const html = await r.text();
            const employer = html.match(regexpEmployer)?.at(0);
            const title = html.match(regexpTitle)?.at(0);
            const salary = html.match(regexpSalary)?.at(0);
            const experience = html.match(regexpExperience)?.at(0);
            const shedule = html.match(regexpShedule)?.at(0);
            const skills = [...html.matchAll(regexpSkills)].join(" | ");
            const descriptionUnparsed = html.match(regexpDescription)?.at(0);
            const descriptionNotShield = descriptionUnparsed.replace(regexpTags, "");
            const description = `${descriptionNotShield.replaceAll(/("+)/mg, "\"$1")}`;
            
            resolve([url, employer, title, salary, experience, shedule, skills, description]);
        });  
    })
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
