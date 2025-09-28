from collections import namedtuple

Song = namedtuple('Song', ['f1', 'f2', 'f3'])

A = Song(.98, 10, 4)
B = Song(.67, 2, 5.6)
C = Song(.86, 3, 4.8)

def findMin(songs):
    min1 = min2 = min3 = float('inf')
    for song in songs:
        min1 = min(song.f1, min1)
        min2 = min(song.f2, min2)
        min3 = min(song.f3, min3)
    return Song(min1, min2, min3)

def findMax(songs):
    max1 = max2 = max3 = 0
    for song in songs:
        max1 = max(song.f1, max1)
        max2 = max(song.f2, max2)
        max3 = max(song.f3, max3)
    return Song(max1, max2, max3)

def normalizeValue(value, min, max):
    return (value - min)/(max - min)

def normalize(value: Song, min: Song, max: Song):
    return Song(normalizeValue(value.f1, min.f1, max.f1), normalizeValue(value.f2, min.f2, max.f2), normalizeValue(value.f3, min.f3, max.f3))

# min = findMin([A,B,C])
# max = findMax([A,B,C])

# print(normalize(A, min, max))


def chebyev(a, b, p=3):
    val = 0
    for i in range(3):
        weight = 1
        val += abs(a[i] - b[i]) ** p
        
    return (val**1/p)

v1 = chebyev(A,B)
v2 = chebyev(A,C)
print(min(v1, v2))