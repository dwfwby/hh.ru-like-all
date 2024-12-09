const ignore = [];

beforeFlipping(async function(){
    let tostart;
    
    do {
        const btns = await getButtons();
        
        if(!btns) break;
        
        for (let btn of btns) {
            const vacancyId = new URL(btn.href).searchParams.get("vacancyId");
        
            if(ignore.includes(vacancyId))
                continue;
        
            tostart = applyVacancy(btn);
            
            ignore.push(vacancyId);
        
            if(tostart) break;
        }
    
    } while (tostart)
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

async function applyVacancy(btn){
    const parent = btn.closest('div[data-qa^="vacancy-serp__vacancy"]');
    let restart = false;

    btn.click();

    await new Promise(resolve => {
        const id = setInterval( () => {
            const relocationConfirm = document.querySelector(`[data-qa="relocation-warning-confirm"]`);
            const isModal = document.querySelector("span.bloko-modal-title")?.innerHTML == "Отклик на вакансию";
            const params = new URLSearchParams(document.location.search);
            const isQuestion = params.get("startedWithQuestion") != null;
            const status = parent.querySelector(`div[class*="workflow-status-container_mobile--"]`);    
            let isApplied;

            if(status && status.children)
                isApplied = Array.from(status.children).at(-1)?.innerHTML == "Вы откликнулись";
    
            relocationConfirm?.click();
            
            if(isApplied){
                resolve();
                clearInterval(id);
            }
            
            if(isQuestion || isModal){
                restart = true;
                
                if(isQuestion)
                    history.back();
                else
                    document.querySelector(".bloko-modal-close-button").click();

                clearInterval(id);
                resolve();
            }
        },100);
    });
        
    return restart;
}
