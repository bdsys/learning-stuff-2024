# Generated by Django 3.2.6 on 2021-09-06 19:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0006_alter_bookinstance_options'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='author',
            options={'ordering': ['last_name', 'first_name'], 'permissions': (('can_create_author', 'Create new Author objects'), ('can_update_author', 'Update existing Author objects'), ('can_delete_author', 'Delete existing Author objects'))},
        ),
        migrations.AlterModelOptions(
            name='book',
            options={'ordering': ['title'], 'permissions': (('can_create_book', 'Create new Book objects'), ('can_update_book', 'Update existing Book objects'), ('can_delete_book', 'Delete existing Book objects'))},
        ),
    ]
