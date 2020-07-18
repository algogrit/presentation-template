#!/usr/bin/env bash

template=`git remote get-url origin`
git remote add template $template

title=`cat TITLE`
gsed -i s/\{Template\}/"$title"/g index.html
gsed -i s/\{title\}/"$title"/g slides.md

kebab_title=`title=$title ruby -e "puts ENV['title'].downcase.split(\" \").join(\"-\")"`
echo $kebab_title
gsed -i s/template/$kebab_title/g CNAME
gsed -i s/template/$kebab_title/g slides.md
cname=`cat CNAME`

git remote remove origin
hub create -d "Presentation for $title" -h "https://$cname" presentation-$kebab_title

git add .

git commit -m "New: $title"
git push -u
