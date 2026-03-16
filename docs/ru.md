---
layout: page
title: Русский
permalink: /ru/
---

# Реальные достижения проекта

* Работал **8 лет в продакшене**.
* Обрабатывал около **40 000 сообщений ежедневно**.
* Использовался примерно в **300 активных чатах каждый день**.
* Был установлен **более чем в 2000 Telegram-чатах**.
* Помог модерировать разговоры в **большом количестве онлайн-сообществ**.

# Aлгоритм работы

## 1. Постановка задачи

Нам нужно создать алгоритм, который будет проверять сообщения в чате на наличие нецензурных слов или языка вражды.

Примеры работы алгоритма:
<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:16px;padding:16px 24px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
"Ой <span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">бля</span>" — "Ой ..."

"Ах ты <span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">хуесос</span>" — "Ах ты ..."

"<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">Еб</span> твою мать" — "... твою мать"

"А ну иди сюда" — остается без изменений</pre>

На первый взгляд данная задача решается легко: составить массив нецензурных слов и просто вырезать все вхождения. Поэтому рассмотрим более сложные примеры:

<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
Им<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">елда</span> Стонтон в предгорьях Грено<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">бля</span> изучала ассам<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">бля</span>ж 🍷

Гарик <span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">Сука</span>чев потре<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">бля</span>ет ски<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">пидар</span> всу<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">хую</span>.

Сва<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">еб</span>оец лечит э<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">пидер</span>мис транспедик</span>улярным а<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">бля</span>тором.
</pre>

Многие слова русского языка содержат в себе нецензурные слова, хотя сами по себе не являются нецензурными. С другой стороны, некоторые нецензурные слова изменены предлогами, суффиксами и окончаниями. А часто — написаны слитно и/или с ошибками. Например:

<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
Он съ<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">еб</span>ал с работы на два часа раньше.

Воттыж<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">блять</span>, обманул нас.

<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">Хуесос</span>ина хитрая!
</pre>

Необходимо создать эвристический алгоритм, который будет достаточно хорошо справляться с этой задачей.

## 2. Зачем это нужно?

Обычно алгоритмы проверки сообщений целиком удаляют сообщение, если оно содержит нецензурные слова. Это хорошее решение для программистов, но плохое для пользователей. Иногда пользователи пишут нецензурные слова случайно, перепутав клавиши. Также алгоритм цензуры может содержать ошибки, но пользователь об этом никогда не узнает. Сообщение может быть очень длинным, содержать глубокую мысль, но из-за одного нецензурного слова будет удалено. Такие ситуации очень раздражают пользователей.

Примеры работы бота:

<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
"Эта информаци есть на сайте imdi, причём на главной странице, 
не обязательно кидать новость с паблика ...ских вы...ков"

"Не хватает "вы все ...ы а я Д'Артан"

"Я лично знаю людей, которые ходили на ...практики. Эмпатию 
к ним я испытываю только в пьяном виде"
</pre>

Нет ни одной большой площадки, где бы был реализован подобный алгоритм.

Домовые чаты, рабочие чаты, чаты по интересам, чаты школьников и студентов — это места, где алгоритм востребован.

## 3. Белый и черный списки

Алгоритм использует белый и черный списки. Рассмотрим простой пример.

Белый список:

<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
"рубля",

"страху"
</pre>

Черный список:

<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
"бля",

"хуй",

"пиздец"
</pre>

Текст для цензуры:

<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
Ну пиздец, бля, как я его застрахую, если у него нет ни рубля?
</pre>

Разбор текста:

<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
Ну <span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">пиздец</span>, <span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">бля</span>, как я его за<span style="color:#16a34a;font-weight:600">стра</span><span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;"><span style="color:#16a34a;font-weight:600">ху</span>ю</span>, если у него нет ни <span style="color:#16a34a;font-weight:600">ру<span style="text-decoration:underline;text-decoration-color:red;text-decoration-thickness:2px;color:inherit;">бля</span></span>?
</pre>

Результат:

<pre class="examples" style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px 16px;font-family:ui-monospace,monospace;font-size:14px;line-height:1.6;">
Ну ..., ..., как я его застрахую, если у него нет ни рубля?
</pre>

Белый список содержит фрагменты слов, которые "защищают" слово от цензуры. Черный список содержит слова, которые нужно вырезать.

## 4. Дьявол в деталях

Обмануть алгоритм просто, достаточно заменить один символ латинской буквой. Или добавить пробелы. Или даже шум.

Кроме русского языка кириллический алфавит используют еще более 10 языков. И многие при этом используют русский мат.

Имея более 10 кириллических алфавитов, обязательно найдется слово, которое будет нецензурным в одном языке и одновременно часто используемым в другом. Поэтому основной язык алгоритма — русский.

Имена собственные, названия компаний, географические названия и т.д. доставляют массу хлопот.

Несмотря на все нюансы, алгоритм работает отлично!

p.s. На самом деле в алгоритме используется ещё и третий список. Вся система реализована на основе алгоритма Ахо–Корасика и работает за один проход по тексту.

## 5. Снизить негатив

Пользователи добавляют бота в свои чаты, чтобы снизить негатив. Но иногда, в разгаре дискуссий, кто-то говорит нецензурное слово... и бот удаляет его, оставляя при этом весь остальной текст.

Для админа. Когда срабатывает бот, это является сигналом: возможно, в чате начинается флейм.

Для пользователя сигнал такой: возможно, стоит взять паузу и подумать о том, что происходит.

Многие пользователи искренне ненавидят цензор-бота, потому что он ВСЕГДА удаляет мат в самый неподходящий момент. Этим, собственно бот и ценен.
