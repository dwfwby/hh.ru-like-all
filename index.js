beforeFlipping(function(){
    return new Promise(async resolve => {
        const btns = await getButtons();

        if(!btns.length){
            resolve();
            return;
        }
    
        const btnsArray = Array.from(btns).map(e => [new URL(e.href).searchParams.get("vacancyId"), e]);
        let i = 0;

        for (let [vacancyId, btn] of btnsArray) {
            (async () => {
                const status = await getType(vacancyId);
            
                if(status == "quickResponse")
                    await applyVacancy(btn);
        
                i++;
                
                if(i == btnsArray.length)
                    resolve();
            })();
            await new Promise((r) => setTimeout(r, 200));
        }
    })
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

function getCurrentPage(){
    return document.querySelector(`a[aria-current="true"]`)?.innerHTML;
}

function getQuickBtns(list){
    return new Promise(resolve => {
        let i = 0;
        const result = [];
        
        list.forEach(async (e) => {
            const [id, btn] = e;
            const status = await getType(id);
            
            if(status == "quickResponse")
                result.push(e);

            i++;

            if(i == list.length)
                resolve(result);
        })  
    })
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
    btn.click();

    return new Promise(resolve => {
        const id = setInterval( () => {
            const relocationConfirm = document.querySelector(`[data-qa="relocation-warning-confirm"]`);
            const closeChatik = document.querySelector(`[data-qa="chatik-close-chatik"]`);
            const isChildBody = btn.closest("body")
    
            relocationConfirm?.click();
            closeChatik?.click();
            
            if(isChildBody){
                clearInterval(id);
                resolve();
            }
        },100);
    });
}

function getButtons(){
    const lastTime = new Date().getTime();
    
    return new Promise(resolve => {
        const id = setInterval(() => {
            const time = new Date().getTime();
            const btns = document.querySelectorAll(`[data-qa="vacancy-serp__vacancy_response"]`);
    
            if(btns.length || time - lastTime >= 5000){
                resolve(btns);
                clearInterval(id);
            }
        }, 100)
    });
}
