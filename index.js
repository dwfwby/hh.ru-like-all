const pagination = Array.from(document.querySelectorAll("a[data-qa='pager-page']")).reverse()
const ignore = [];

pagination.forEach(async p => {
    let started = true;
    
    p.click();
    
    do {
        console.log(1)
        started = false;
        const btns = await getButtons();
        
        if(!btns) break;
        
        for (let btn of btns) {
            const vacancyId = new URL(btn.href).searchParams.get("vacancyId");
        
            if(ignore.includes(vacancyId))
                continue;
    
            started = applyVacancy(btn);
            
            ignore.push(vacancyId);
    
            if(started) break;
            
            console.log("finish")
        }
        
        console.log("finish2")
    } while (started)
        
    console.log("finish3")
})

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
                clearInterval(arr.id);
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

