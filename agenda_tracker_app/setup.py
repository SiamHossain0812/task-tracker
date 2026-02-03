from setuptools import setup, find_packages

setup(
    name='agenda-tracker-app',
    version='1.0.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'Django>=4.2',
        'djangorestframework>=3.14.0',
        'djangorestframework-simplejwt>=5.2.2',
        'django-cors-headers>=4.0.0',
        'channels>=4.0.0',
        'channels-redis>=4.0.0',
        'daphne>=4.0.0',
        'Pillow>=10.0.0',
    ],
    author='Antigravity',
    description='A modern React-based Agenda and Project Tracker PWA for Django.',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    url='https://github.com/SiamHossain0812/agenda-tracker',
    classifiers=[
        'Framework :: Django',
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
    ],
)
