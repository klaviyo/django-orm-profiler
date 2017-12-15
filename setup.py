from django_orm_profiler import VERSION

from setuptools import setup, find_packages

setup(
    name='django-orm-profiler',
    version=VERSION,
    description='Django ORM profiler to find redundant and unnecessary queries.',
    url='https://github.com/klaviyo/django-orm-profiler',
    download_url='https://github.com/klaviyo/django-orm-profiler/archive/1.0.3.tar.gz',
    author='Klaviyo',
    author_email='community@klaviyo.com',
    license='MIT',
    packages=find_packages(),
    zip_safe=False,
    install_requires=[
        'pyyaml',
    ],
)
