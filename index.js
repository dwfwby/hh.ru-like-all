async function applyVacancy(btn){
    const vacancyId = new URL(btn.href).searchParams.get("vacancyId");
    const parent = btn.closest('div[data-qa^="vacancy-serp__vacancy"]');
    const result = {id: vacancyId, restart: false};

    btn.click();

    await new Promise(resolve => {
        const id = setInterval( () => {
            let relocationConfirm = document.querySelector(`[data-qa="relocation-warning-confirm"]`);
            let isModal = document.querySelector("span.bloko-modal-title")?.innerHTML == "Отклик на вакансию";
            let params = new URLSearchParams(document.location.search);
            let isQuestion = params.get("startedWithQuestion") != null;
            let status = parent.querySelector(`div[class*="workflow-status-container_mobile--"]`);    
            let isApplied;

            if(status && status.children)
                Array.from(status.children).at(-1)?.innerHTML == "Вы откликнулись";
    
            relocationConfirm?.click();
            
            if(isApplied){
                resolve();
                clearInterval(arr.id);
            }
            
            if(isQuestion || isModal){
                result.restart = true;
                
                if(isQuestion)
                    history.back();
                else
                    document.querySelector(".bloko-modal-close-button").click();

                clearInterval(id);
                resolve();
            }
        },100);
    });
        
    return result
}

