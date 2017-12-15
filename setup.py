from django_orm_profiler import VERSION

from setuptools import setup

setup(
    name='django-orm-profiler',
    version=VERSION,
    description='Django ORM profiler to find redundant and unnecessary queries.',
    url='https://github.com/klaviyo/django-orm-profiler',
    download_url='https://github.com/klaviyo/django-orm-profiler/archive/1.0.0.tar.gz',
    author='Klaviyo',
    author_email='community@klaviyo.com',
    license='MIT',
    packages=['django_orm_profiler'],
    zip_safe=False,
    install_requires=[
        'pyyaml',
    ],
)
