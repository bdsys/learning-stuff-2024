# Generated by Django 3.2.6 on 2021-09-04 19:48

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0004_bookinstance_borrower'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='bookinstance',
            options={'ordering': ['book'], 'permissions': (('can_mark_returned', 'Set book as returned'),)},
        ),
    ]