from amazoncaptcha import AmazonCaptcha
import sys
directory_path = sys.argv[1]

path = directory_path + '.png'
captcha = AmazonCaptcha(path)
solution = captcha.solve()
print(solution)
