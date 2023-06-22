var pageParams = {
    'dark'    : getUrlParam('dark', undefined),
    'section' : getUrlParam('section', undefined),
    'chapter' : getUrlParam('chapter', undefined),
    'company' : getUrlParam('company', undefined),
    'type'    : getUrlParam('type', undefined)
};

let config;
async function fetchConfig() {
    try {
        const response = await fetch('./static/config.json');
        config = await response.json();
    } catch(e) {
        console.error(`[fetchConfig] code: ${e.status}; message: ${e}`);
    }
}

let companyConfig;
let companyConfigPath;
async function fetchCompanyConfig() {
    try {
        companyConfigPath = config.find(e => e['id'] ==  pageParams['company'])['data'];
        companyConfig = await $.getJSON(companyConfigPath + '/config.json');
    } catch(e) {
        console.error(`[fetchCompanyConfig] code: ${e.status}; message: ${e}`);
    }
}

let sectionData;
async function fetchSectionData(yamlName) {
    try {
        const response = await $.get(companyConfigPath  + '/' + yamlName + '.yaml');
        sectionData = await jsyaml.load(response);
    } catch(e) {
        console.error(`[fetchSectionData] code: ${e.status}; message: ${e}`);
    }
}

let sectionObj;

$(document).ready(() => {

    $('#theme>input').prop('checked', pageParams['dark'] == '1');
    changeTheme();

    Hyphenopoly.config({
        require: {
            "ru": "электротехнологический"
        },
        paths: {
            patterndir: "./static/lib/hyphenopoly/patterns/",
            maindir: "./static/lib/hyphenopoly/"
        },
        setup: {
            selectors: {
                ".content": {}
            }
        }
    });

    $('.author').html('&copy; Vitalii Vovk, ' + new Date().getFullYear());

    $('.navigator-container').css('display', pageParams['section'] == undefined ? 'none' : 'inline-block');

    document.addEventListener("fullscreenchange", () => {
        $('#screen>svg>use').attr('xlink:href', document.fullscreenElement ? '#ri-fullscreen-exit-fill' : '#ri-fullscreen-fill'); 
    });
    
    if (pageParams['company'] == undefined) {
        fetchConfig().then(printCompanyMenu);        
    } else {
        $('#btn-home').on("click", () => {
            location.href = ".?company=" + pageParams['company'];
        });
        fetchConfig().then(() => {
            fetchCompanyConfig().then(() => {
                if (pageParams['section'] == undefined) {
                    printSectionsPage();
                } else {
                    const chapter = companyConfig.find(e => e['id'] == pageParams['chapter']);
                    sectionObj = chapter['items'].find(e => e['id'] == pageParams['section']);
                    var yamlName = sectionObj['data'] == null ? pageParams['section'] : sectionObj['data'];
                    fetchSectionData(yamlName).then(() => {
                        switch(pageParams['type']) {
                            case 'card':
                                printChapterPage();
                                break;
                            case 'doc':
                                printDocPage();
                                break;
                            default:
                                console.log('Invalid parameter "type": ' + pageParams['type']);
                        }   
                    });
                }
            });
        });
    }
});

function getUrlParam(parameter, defaultvalue){
    var urlparam = (window.location.href.indexOf(parameter) >- 1) ? getUrlVars()[parameter] : defaultvalue;
    return (urlparam !== undefined) ? urlparam : defaultvalue;
}

function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getCompanyItem(companyJsonObj) {

    let svg = Object.assign(document.createElement('svg'), {
        className: 'ri-icn-card'
    });
    let use = document.createElement('use');
    use.setAttribute('xlink:href', '#ma-apartment');
    svg.append(use);
    const p = Object.assign(document.createElement('p'), {
        innerHTML: companyJsonObj['description']
    });

    let bottomDiv = Object.assign(document.createElement('div'), {
        className: 'elem-bottom-div',
        innerHTML: p.outerHTML
    });

    let innerHtmlStr = `${svg.outerHTML}${bottomDiv.outerHTML}`;

    let elem = Object.assign(document.createElement("div"),{
        className: 'elem',
    });
    elem.setAttribute('files', companyJsonObj['files']);
    elem.addEventListener("click", (event) => {
        location.href = ".?company=" + companyJsonObj['id'];
    }, false);

    if (companyJsonObj['background'] != undefined && companyJsonObj['background'] != null) {
        let div = Object.assign(document.createElement("div"),{
            className: 'elem-blur-div',
            innerHTML: innerHtmlStr
        });
        elem.append(div);
        elem.style.backgroundImage = `url(${companyJsonObj['data']}/${companyJsonObj['background']})`;
        elem.style.backgroundSize = 'cover';
        elem.style.padding = 'unset';
    } else {
        elem.innerHTML = innerHtmlStr;
    }
    return elem;
}

function renderTable(items, table_id) {
    var rows = [];
    for (var i=0; i < items.length; i++) {
        if (i % 3 == 0) {
            rows.push([]);
        };
        rows[rows.length - 1].push(items[i]);
    }
    rows.forEach(cells => {
        let row = Object.assign(document.createElement('div'), {className: 'row'});
        cells.forEach(cell => {
            row.append(cell);
        });
        if (table_id == undefined) {
            $('.center').append(cells);
        } else {
            $('.' + table_id).append(cells);
        }
    });
}

function printCompanyMenu() {
    const h2 = Object.assign(document.createElement('h2'), {
        className: 'tbl-title',
        style: 'margin-bottom: 1rem;',
        innerHTML: 'Материалы для самоподготовки к аттестации в комиссии ТЭЦ</br></br>ПАО "ТГК-1" филиал "Невский"'
    });
    $('div.center').before(h2.outerHTML);
    var compArray = [];
    config.forEach(company => {
        compArray.push(getCompanyItem(company));
    });
    renderTable(compArray);
}

function getBlockItem(chapterId, blockJsonObj) {

    let svg = Object.assign(document.createElement('svg'), {
        className: 'ri-icn-card'
    });
    let use = document.createElement('use');
    use.setAttribute('xlink:href', blockJsonObj['icon']);
    svg.append(use);
    const p = Object.assign(document.createElement('p'), {
        innerHTML: blockJsonObj['description']
    });

    let bottomDiv = Object.assign(document.createElement('div'), {
        className: 'elem-bottom-div',
        innerHTML: p.outerHTML
    });

    let innerHtmlStr = `${svg.outerHTML}${bottomDiv.outerHTML}`;

    let elem = Object.assign(document.createElement("div"),{
        className: 'elem'
    });
    elem.setAttribute('chapter', chapterId);
    elem.addEventListener("click", () => {
        location.href = ".?company=" + pageParams['company'] + '&chapter=' + chapterId + '&section=' + blockJsonObj['id'] + '&type=' + blockJsonObj['type'];
    }, false);

    if (blockJsonObj['background'] != undefined && blockJsonObj['background'] != null) {
        let div = Object.assign(document.createElement("div"),{
            className: 'elem-blur-div',
            innerHTML: innerHtmlStr
        });
        elem.append(div);
        elem.style.backgroundImage = `url(${companyConfigPath}/img/${blockJsonObj['background']})`;
        elem.style.backgroundSize = 'cover';
        elem.style.padding = 'unset';
    } else {
        elem.innerHTML = innerHtmlStr;
    }
    return elem;
}

function printSectionsPage() {
    var company = config.find(e => e['id'] == pageParams['company']);  
    $('title').text('EXAM. ' + company['description']);
    $('.active-chapter>svg>use').attr('xlink:href','#ri-home-2-fill');
    $('div.content').before('\
        <div class="company-title-container">\
            <svg class="ri-icn" onclick="location.href=\'.\';"><use xlink:href="#arrow_back"></use></svg>\
            <div><h2 class="company-title" onclick="location.href=\'.\';">' + company['description'] + '</h2></div>\
        </div>');
    companyConfig.forEach(chapter => {
        $('div.content').append('\
            <div class="section">\
                <h2 class="tbl-title">' + chapter['title'] + '</h2>\
                <div class="center">\
                    <div class="tbl ' + chapter['id'] + '">\
                    </div>\
                </div>\
            </div>');
        var items = [];
        chapter['items'].forEach(item => {
            items.push(getBlockItem(chapter['id'], item));
        });
        renderTable(items, chapter['id']);
    });
    changeTheme();
}

function changeTheme() {
    $('body').attr('dark', $('#theme>input').prop('checked') ? '1' : '0');
    $('#theme>svg>use').attr('xlink:href', $('body').attr('dark')=="1" ? '#light_mode' : '#dark_mode');
}

function showAnswers() {
    $('#answer>svg>use').attr('xlink:href', $('#answer>input').prop('checked') ? '#ri-eye-off-fill' : '#ri-eye-fill');
    $('details').attr('open', $('#answer>input').prop('checked') ? true : false);
}

function fullScreen() {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
}

function showCardSwithces() {
    currentCard >= countCard ? $('#btn-next').css('display', 'none') : $('#btn-next').css('display', 'inline-flex');
    if ($('#btn-next').css('display') == 'none')
        $('#btn-prev').css('border-radius', '0 1rem 1rem 0');
    currentCard < 1 ? $('#btn-prev').css('display', 'none') : $('#btn-prev').css('display', 'inline-flex');
    if (countCard <= 1)
        $('.current-card-number').css('display', 'none');
    $('.current-card-number').css('display') == 'none' ? $('#screen').css('border-radius', '0 1rem 1rem 0') : $('#screen').css('border-radius', '0');
}

function nextCard() {
    $('body').attr('card', (currentCard < countCard) ? currentCard + 1 : countCard);
    getCard();
}

function prevCard() {
    $('body').attr('card', (currentCard >= 1) ? currentCard - 1 : 0);
    getCard(); 
}

function printChapterPage() {
    $('body').attr('card', 0);  
    let div = Object.assign(document.createElement("div"),{
        className:'card-hdr'
    });
    div.append(
        Object.assign(document.createElement("h2"),{
            id: 'title',
            innerHTML: sectionObj['description'] + ' (' + sectionObj['name'] + ')'
        })
    );
    $('div.content').before(div);
    getCard();
}

function printDocPage() {
    $('body').attr('card', 0);  
    countCard = currentCard = 0;
    showCardSwithces();
    let div = Object.assign(document.createElement("div"),{
        className:'card-hdr'
    });
    div.append(
        Object.assign(document.createElement("h2"),{
            id: 'title',
            innerHTML: sectionObj['description'] + ' (' + sectionObj['name'] + ')'
        })
    );
    $('div.content').before(div);

    var ttl = sectionObj['name'];
    $('title').text('ExaM. ' + ttl);
    $('#chapter-id').text(ttl);

    sectionData[pageParams['section']].forEach(cat => {
        let summary = Object.assign(document.createElement("summary"),{
            lang: 'ru',
            innerHTML: cat['hdr']
        });
        let details = document.createElement("details");
        details.append(summary);
        
        cat['subcats'].forEach(subcat => {
            if (subcat['hdr'] == null) {
                let div = Object.assign(document.createElement('div'), {
                    className: 'answer',
                    innerHTML: formatAnswerForHtml(subcat['content'])
                });
                details.append(div); 
            } else {
                let subdetails = document.createElement("details");
                subdetails.append(
                    Object.assign(document.createElement("summary"),{
                        className: 'summary-subdetails',
                        lang: 'ru',
                        innerHTML: subcat['hdr']
                    }),
                    Object.assign(document.createElement('div'), {
                        className: 'answer-subdetails',
                        innerHTML: formatAnswerForHtml(subcat['content'])
                    })
                );
                details.append(subdetails);
            }
        });
        $('div.content').append(details);
    });
}

function formatAnswerForHtml(answer) {
    var result = [];

    const match = answer.matchAll(/#\?img([\s\S]*?)\?#/g);
    for (const m of match) {
        const [imgSrc = null, imgAlt = null] = m[1].trim().split('\n');
        answer = answer.replace(m[0], `<div class="answer-media"><img src="${companyConfigPath}/img/${pageParams['section']}/${imgSrc}" alt="${imgAlt}"></img>` + (imgAlt != null ? `<h2>${imgAlt}</h2></div>` : `</div>`));
    }
    
    answer.split('\n').forEach(e => {
        if (e.startsWith('<div'))
            result.push(e);
        else
            result.push('<p>' + e + '</p>');
    });
    return result.join('');
}

function getCard(){
    currentCard = parseInt($('body').attr('card'));

    var ttl = sectionObj['name'];
    $('title').text('ExaM. ' + ttl);
    $('#chapter-id').text(ttl);

    $('li > a').attr('class', '');
    $('div.content').empty();

    if (parseInt($('body').attr('count')) === 0) {
        countCard = sectionData[pageParams['section']].length -1;
        $('body').attr('count', countCard);
    }

    $('.current-card-number').html((currentCard+1) + '&nbsp;/&nbsp;' + (countCard+1));

    var DataQ = sectionData[pageParams['section']][currentCard]['c'];
    DataQ.forEach(question => {
        let summary = Object.assign(document.createElement("summary"),{
            lang: 'ru',
            innerHTML: question['q']['q']
        });
        if (question['q']['n'] != null) {
            summary.append(Object.assign(document.createElement("span"),{
                className: 'ntd',
                lang: 'ru',
                innerHTML: '<br>' + question['q']['n']
            }));
        }
        let div = Object.assign(document.createElement('div'), {
            className: 'answer'
        });
        div.append(Object.assign(document.createElement('p'), {
            lang: 'ru',
            innerHTML: formatAnswerForHtml(question['q']['a'])
        }));
        let details = document.createElement("details");
        details.append(summary, div);
        $('div.content').append(details);
    });
    window.scrollTo(0,0);
    showAnswers();
    showCardSwithces();
}
