$( function() {
    
    // ---------- cat list -----------
    $(".tc-links-navbar-style5 .category-box .category-link").on("click", function(){
        $(this).siblings(".list-card").toggleClass("active");
        $(this).children(".arrow").toggleClass("rotate");
    })
    
});


// ------------ swiper sliders -----------
$(document).ready(function() {

    // ------------ tc-header-style5 -----------
    var swiper = new Swiper('.tc-header-style5 .header-slider5', {
        slidesPerView: 1,
        spaceBetween: 30,
        centeredSlides: true,
        speed: 1000,
        pagination: {
            el: '.swiper-pagination',
            type: 'fraction',
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: true,
    });

    // ------------ tc-products-slider-style5 -----------
    var swiper = new Swiper('.tc-products-slider-style5 .products-slider', {
        slidesPerView: 4,
        spaceBetween: 0,
        // centeredSlides: true,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-products-slider-style5 .swiper-button-next',
            prevEl: '.tc-products-slider-style5 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: false,
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            480: {
                slidesPerView: 2,
            },
            787: {
                slidesPerView: 3,
            },
            991: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 5,
            }
        }
    });

    // ------------ tc-products-slider-style5 -----------
    var swiper = new Swiper('.tc-tabs-style5 .tabs-product-slider5', {
        slidesPerView: 4,
        spaceBetween: 30,
        // centeredSlides: true,
        speed: 1000,
        pagination: false,
        navigation: false,
        mousewheel: false,
        keyboard: true,
        autoplay: false,
        loop: false,
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            480: {
                slidesPerView: 2,
            },
            787: {
                slidesPerView: 3,
            },
            991: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 4.7,
            }
        }
    });
    
});


// ------------ scripts -----------
$(document).ready(function(){
    const second = 1000,
    minute = second * 60,
    hour = minute * 60,
    day = hour * 24,
    week = hour * 24 * 7;

    let countDown = new Date('Oct 29, 2023 11:30').getTime(),
        x = setInterval(function() {

            let now = new Date().getTime(),
                distance = countDown - now;

            document.getElementById('days').innerText = Math.floor(distance / (day)),
            document.getElementById('hours').innerText = Math.floor((distance % (day)) / (hour)),
            document.getElementById('minutes').innerText = Math.floor((distance % (hour)) / (minute)),
            document.getElementById('seconds').innerText = Math.floor((distance % (minute)) / second);

        }, second)
});

