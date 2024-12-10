const modalText = "."; // Вставить хотябы один символ, чтобы учитывались модальные окна.
const ignore = [];

beforeFlipping(async function(){

    const btns = await getButtons();
    
    if(!btns) return;
    
    for (let btn of btns) {
        const vacancyId = new URL(btn.href).searchParams.get("vacancyId");
        const status = await getType(vacancyId);
        
        if(status != "quickResponse" && (status != "modal" || !modalText))
            ignore.push(vacancyId);

        if(ignore.includes(vacancyId))
            continue;
    
        applyVacancy(btn);
        
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
            const modalConfirm = document.querySelector(`button[data-qa="vacancy-response-submit-popup"]`);
            const modalTextarea = document.querySelector(`textarea[data-qa="vacancy-response-popup-form-letter-input"]`);
            const status = parent.querySelector(`div[class*="workflow-status-container_mobile--"]`);    
            let isApplied;

            if(status && status.children)
                isApplied = Array.from(status.children).at(-1)?.innerHTML == "Вы откликнулись";
    
            relocationConfirm?.click();
            
            if(modalConfirm && modalTextarea && modalText){
                modalTextarea.value = modalText;
                modalConfirm.click();
            }

            if(isApplied){
                clearInterval(id);
                resolve();
            }
        },100);
    });
}
