$( function() {

    // ---------- cat list -----------
    $(".tc-navbar-style4.nav-links .cat-list .list-btn").on("click", function(){
        $(this).siblings(".list-card").toggleClass("active");
        $(this).children(".arrow").toggleClass("rotate");
    })

    if ($(window).width() <= 991) {
        $(".tc-navbar-style4.nav-links .cat-list .list-card").addClass("hide");
        $(".tc-navbar-style4.nav-links .cat-list .list-btn").one("click", function(){
            $(this).siblings(".list-card").removeClass("hide");
            $(this).siblings(".list-card").addClass("active");
        })
      }

});

// ------------ swiper sliders -----------
$(document).ready(function() {

    // header slider 
    var swiper = new Swiper('.tc-header-style4 .header-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-header-style4 .swiper-button-next',
            prevEl: '.tc-header-style4 .swiper-button-prev',
        },
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: true,
    });

    // categories slider 
    var swiper = new Swiper('.tc-categories-style4 .categories-slider4', {
        slidesPerView: 1,
        spaceBetween: 20,
        speed: 1000,
        pagination: false,
        navigation: false,
        mousewheel: false,
        keyboard: true,
        autoplay: false,
        loop: false,
        breakpoints: {
            0: {
                slidesPerView: 2,
            },
            480: {
                slidesPerView: 4,
            },
            787: {
                slidesPerView: 6,
            },
            991: {
                slidesPerView: 8,
            },
            1200: {
                slidesPerView: 10,
            }
        }
    });

    // recommended slider 
    var swiper = new Swiper('.tc-recommended-style4 .recommended-slider', {
        slidesPerView: 5,
        spaceBetween: 20,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.tc-recommended-style4 .swiper-button-next',
            prevEl: '.tc-recommended-style4 .swiper-button-prev',
        },
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
                slidesPerView: 5,
            }
        }
    });

    // recommended prod slider 
    var swiper = new Swiper('.tc-recommended-style4 .prod-img-slider .img-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        speed: 1000,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: false,
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: false,
    });

    // sale slider 
    var swiper = new Swiper('.tc-sale-style4 .sale-slider', {
        slidesPerView: 5,
        spaceBetween: 20,
        speed: 1000,
        pagination: false,
        navigation: {
            nextEl: '.sale-slider-content .swiper-button-next',
            prevEl: '.sale-slider-content .swiper-button-prev',
        },
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
                slidesPerView: 5,
            }
        }
    });

    // sale prod slider 
    var swiper = new Swiper('.tc-sale-style4 .prod-img-slider .img-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        speed: 1000,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: false,
        mousewheel: false,
        keyboard: true,
        autoplay: {
            delay: 5000,
        },
        loop: false,
    });

});


// ------------ scripts -----------
$(document).ready(function(){

});

