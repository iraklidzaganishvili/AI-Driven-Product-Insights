from amazoncaptcha import AmazonCaptcha

captcha = AmazonCaptcha('captcha.png')
solution = captcha.solve()
print(solution)
